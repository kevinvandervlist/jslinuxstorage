#!/bin/sh
echo "Setting up initial device node of sb:/dev/sb0"
mknod /dev/sb0 b 250 0
echo "Setting up device node of partition 1:/dev/sb1"
mknod /dev/sb1 b 250 1
