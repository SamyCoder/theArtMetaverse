#!/bin/bash


set -ex
set -o pipefail

# This gets a tarball from github and than extracts it to src_dir

#Usage: GetSrcFromGithub user package tag src_dir [sha512]

function GetSrcFromGithub()
{
    [ -n "$3" ] || exit 1

    local cwd="$PWD"
    local name="$1-$2"
    local path="$1/$2"
    local tag="$3"
    local tarfile=$cwd/$1-$2-ZxxX_src.tar.gz

    # This gets a tarball file from github for the package
    wget -O $tarfile https://github.com/$path/tarball/$tag

    if [ -n "$5" ] ; then
        # Check that the file has a good SHA512 sum
        echo "$5  $tarfile" | sha512sum -c
    fi

    local tmpdir=$(mktemp -d --suffix=$name)

    cd $tmpdir
    tar -xzf $tarfile
    mv ${name}* $cwd/$4
    rmdir $tmpdir
    cd -
    mv $tarfile $4
}
