/* 
   Linux launcher

   Copyright (c) 2011 Fabrice Bellard

   Redistribution or commercial use is prohibited without the author's
   permission.
*/
"use strict";

var term, pc, boot_start_time, sbd;

function uploadFile(file) {
	sbd.storage.loadData(file);
}

function download() {
	document.getElementById("download").innerHTML = sbd.storage.getDownloadLink();
}


function term_start()
{
    term = new Term(80, 30, term_handler);

    term.open();
}

/* send chars to the serial port */
function term_handler(str)
{
    pc.serial.send_chars(str);
}

/* just used to display the boot time in the VM */
function get_boot_time()
{
    return (+new Date()) - boot_start_time;
}

function start()
{
    var start_addr, initrd_size, params, cmdline_addr;
    
    params = new Object();

    /* serial output chars */
    params.serial_write = term.write.bind(term);

    /* memory size (in bytes) */
    params.mem_size = 12 * 1024 * 1024;

    params.get_boot_time = get_boot_time;

    pc = new PCEmulator(params);

	sbd = new SBD(pc);

	// Load the binary at 1mbyte:
	// 0x00100000 == 2^20 
	//pc.load_binary("vmlinux-3.0.4.bin", 0x00100000);
	pc.load_binary("vmlinux-3.0.4-simpleblock.bin", 0x00100000);
	//pc.load_binary("vmlinux-3.0.4-net.bin", 0x00100000);

    initrd_size = pc.load_binary("root.ext2", 0x00500000);

    start_addr = 0x10000;
    pc.load_binary("linuxstart.bin", start_addr);

    /*  set the Linux kernel command line */
    /* Note: we don't use initramfs because it is not possible to
       disable gzip decompression in this case, which would be too
       slow. */
    cmdline_addr = 0xf800;
	/* notsc=1 disables time stamp counter; time step counter since reset.
	   jslinux does not have one. */
    pc.cpu.write_string(cmdline_addr, "console=ttyS0 root=/dev/ram0 rw init=/sbin/init notsc=1");

    pc.cpu.eip = start_addr;
    pc.cpu.regs[0] = params.mem_size; /* eax */
    pc.cpu.regs[3] = initrd_size; /* ebx */
    pc.cpu.regs[1] = cmdline_addr; /* ecx */

    boot_start_time = (+new Date());

    pc.start();
}

term_start();
