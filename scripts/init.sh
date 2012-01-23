#!/bin/sh
./mkdevnode.sh
./fdisk.sh
./mkdevnode.sh
./mkfs.sh
./mount.sh
