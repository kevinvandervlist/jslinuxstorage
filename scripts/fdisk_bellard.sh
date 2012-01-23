#!/bin/sh
echo "Creating partition on /dev/sb1"
fdisk /dev/sb0 << EOF
n
p
1
2
128
w
q
EOF
echo ""