#!/bin/sh
echo "Mounting /dev/sb1 => /mnt/persistent"
mkdir /mnt/persistent
mount /dev/sb1 /mnt/persistent
