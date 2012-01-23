/**
 * Persistent storage for JS/Linux.
 * Copyright (C) 2011 Kevin van der Vlist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 *
 * Kevin van der Vlist - kevin@kevinvandervlist.nl
 */

/**
 * JavaScript simple block device
 */

SBD.prototype.debug = false;

SBD.prototype.sbreg = {
	BASE: 0x3f0,
	STATUS: 0, // R: Status
	VAL: 1, // R/W: The value
	OPMODE: 2, // W: The operation mode (Read / Write)
	SECLOC: 3, // W:FIFO High 8 bit of address + Low 8 bit off address
	BYTELOC: 4, // W:FIFO High 8 bit of byte + Low 8 bit off byte
	DO_OP: 5 //W: Start the operation on the device
};

// Device information
SBD.prototype.sbdev = {
	NSECT: 2048,
	SECTSIZE: 512
};

SBD.prototype.opmode = {
	READ: 0x00,
	WRITE: 0xff
};

SBD.prototype.state = {
	READY: 0x00,
	LOCK: 0xff
};

function SBD(pc) {
	pc.sbd = this;
	this.pc = pc;
	
	try {
		this.storage = Storage.prototype.getStorageBackend(this.sbdev.NSECT, this.sbdev.SECTSIZE, Storage.prototype.type.HTML5STORAGE);
	} catch (e) {
		alert(e);
	}

	this.status = this.state.READY;
	this.val = 0;
	this.operation = this.opmode.READ;
	this.secloc = new Array();
	this.secloc[0] = 0;
	this.secloc[1] = 0;
	this.byteloc = new Array();
	this.byteloc[0] = 0;
	this.byteloc[1] = 0;
	this.do_op = 0;

    this.pc.register_ioport_read(this.sbreg.BASE, 2, 1, this.read_port.bind(this));
	// Bind base+1 - 5 write
    this.pc.register_ioport_write(this.sbreg.BASE + 1, 5, 1, this.write_port.bind(this));

	if(this.debug) {
		console.log("Created SBD: SimpleBlockDevice");
	}
}

SBD.prototype.read_port = function (rreg) {
	var reg = rreg & 7;
	var retval;

    switch (reg) {
    case this.sbreg.STATUS:
		retval = this.read_status();
        break;
    case this.sbreg.VAL:
		retval = this.read_val();
        break;
    default:
		retval = -1;
        break;
    }

	if(this.debug) {
		console.log("read reg%d: 0x%s", reg, this.dec2hex(retval, 2));
	}
	return retval;
}

SBD.prototype.write_port = function (rreg, value) {
	var reg = rreg & 7;

    switch (reg) {
    case this.sbreg.VAL:
		this.write_val(value);
        break;
    case this.sbreg.OPMODE:
		this.write_opmode(value);
        break;
    case this.sbreg.SECLOC:
		this.write_secloc(value);
        break;
    case this.sbreg.BYTELOC:
		this.write_byteloc(value);
        break;
    case this.sbreg.DO_OP:
		this.write_do_op(value);
        break;
    default:
        break;
    }

	if(this.debug) {
		console.log("write reg%d: 0x%s", reg & 7, this.dec2hex(value, 2));
	}
}

SBD.prototype.read_status = function() {
	if(this.debug) {
		console.log("read_status: 0x%s", this.dec2hex(this.status, 2));
	}
	return this.status;
}

SBD.prototype.read_val = function() {
	if(this.debug) {
		console.log("read_val: 0x%s", this.dec2hex(this.val, 2));
	}
	var ret = this.val;
	// And unlock the device
	this.status = this.state.READY;
	return ret;
}

SBD.prototype.write_val = function(value) {
	if(this.debug) {
		console.log("write_val: 0x%s", this.dec2hex(value, 2));
	}
	this.val = value;
}

SBD.prototype.write_opmode = function(value) {
	if(this.debug) {
		console.log("write_opmode: 0x%s", this.dec2hex(value, 2));
	}
	this.operation = value;

	// Also make sure we lock the device
	this.status = this.state.LOCK;
}
SBD.prototype.write_secloc = function(value) {
	if(this.debug) {
		console.log("write_secloc: 0x%s", this.dec2hex(value, 2));
	}
	this.secloc[1] = this.secloc[0];
	this.secloc[0] = value;
}

SBD.prototype.write_byteloc = function(value) {
	if(this.debug) {
		console.log("write_byteloc: 0x%s", this.dec2hex(value, 2));
	}
	this.byteloc[1] = this.byteloc[0];
	this.byteloc[0] = value;
}

SBD.prototype.write_do_op = function(value) {
	var byte = (this.byteloc[1] << 8) + (this.byteloc[0]);
	var sect = (this.secloc[1] << 8) + (this.secloc[0]);

	if(this.operation == this.opmode.READ) {
		if(this.debug) {
			console.log("do_op: READ byte %d sect %d", byte, sect);
		}
		this.val = this.storage.getByte(sect, byte);
	} else if(this.operation == this.opmode.WRITE) {		
		if(this.debug) {
			console.log("do_op: WRITE byte %d sect %d", byte, sect);
		}
		this.storage.setByte(sect, byte, this.val);
		// And unlock the device
		this.status = this.state.READY;
	}

}

SBD.prototype.dec2hex = function (d, padding) {
	var hex = Number(d).toString(16);
	padding = typeof (padding) === "undefined" || padding === null ? padding = 2 : padding;

    while (hex.length < padding) {
        hex = "0" + hex;
    }

    return hex;
}
