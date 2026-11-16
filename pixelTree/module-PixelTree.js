var pixelTreeSetColor = "#111111";
var pixelTreeUnsetColor = "#EEEEEE";
var pixelTreeDebugColor = "#2222ff";
var indivisibleAmount = 1;
function PixelTree(x, y, width, height) {
	// passed attributes
	this.x = x;
	this.y = y;
	this.width = Math.abs(width);
	this.height = Math.abs(height);
	
	// children
	this.upleft = undefined;
	this.downright = undefined;
	
	// values
	this.isSet = false;	
	this.isUpdated = false;
	this.usesChildren = false;
	this.isLazy = false;

	// creates children of a node, whether it needs them or not.
	// make sure nodes need them before use.
	this.makeChildren = function(){
		if(this.width < this.height){
			// north/south split
			var split = Math.floor(this.height / 2);
			this.upleft = new PixelTree(this.x, this.y, this.width, split);
			this.downright = new PixelTree(this.x, this.y + split, this.width, this.height - split);
		}
		else{
			// west/east split
			var split = Math.floor(this.width / 2);
			this.upleft = new PixelTree(this.x, this.y, split, this.height);
			this.downright = new PixelTree(this.x + split, this.y, this.width - split, this.height);
		}
		this.upleft.isSet = this.isSet;
		this.downright.isSet = this.isSet;
	}

	// make sure the node has children before use
	this.tryCompress = function(){
		this.lazyPropagation();
		if(!(this.upleft.usesChildren || this.downright.usesChildren)){
			if(this.upleft.isSet == this.downright.isSet){
				this.isUpdated = false;
				this.isSet = this.upleft.isSet;
				this.usesChildren = false;
			}
		}
	}

	this.lazyPropagation = function(){
		if(this.isLazy){
			this.isLazy = false;
			this.usesChildren = false;
			if(this.upleft != undefined){
				this.upleft.isLazy = true;
				this.upleft.isSet = this.isSet;
				this.upleft.isUpdated = false;
				this.downright.isLazy = true;
				this.downright.isSet = this.isSet;
				this.downright.isUpdated = false;
			}
		}
	}

	// sets a square region of pixels
	this.set = function(xx, yy, ww, hh, newValue){
		this.lazyPropagation();
		// no intersection? return
		if(xx + ww <= this.x || this.x + this.width <= xx || yy + hh <= this.y || this.y + this.height <= yy){
			return;
		}
		// full intersection? set it
		if((xx <= this.x) && (this.x + this.width <= xx + ww) && (yy <= this.y) && (this.y + this.height <= yy + hh)){
			//this.isUpdated = (this.isSet == newValue);
			this.isUpdated = false;
			this.isSet = newValue;
			this.usesChildren = false;
			if(this.upleft != undefined){
				this.upleft.isSet = newValue;
				this.upleft.isLazy = true;
				this.downright.isSet = newValue;
				this.downright.isLazy = true;
			}
			//ctx2.strokeStyle = pixelTreeDebugColor;
			//ctx2.strokeRect(this.x, this.y, this.width, this.height);
			//alert(this.x+" "+this.y+" "+this.width+" "+this.height);
			return;
		}
		// needs to recurse?
		if(this.isSet == newValue && this.usesChildren == false){
			return;
		}
		// big enough to need children?
		if(this.width > indivisibleAmount || this.height > indivisibleAmount){
			this.usesChildren = true;

			// no children?
			if(this.upleft == undefined){
				this.makeChildren();
			}
			
			// recursive calls
			this.upleft.set(xx, yy, ww, hh, newValue);
			this.downright.set(xx, yy, ww, hh, newValue);

			this.isUpdated = (this.upleft.isUpdated && this.downright.isUpdated);			
			//this.isUpdated = false;

			this.tryCompress();
		}
	}
	
	// draws stuff
	this.update = function(ctx){
		this.lazyPropagation();
		if(!this.isUpdated)
		{
			if(!this.usesChildren){
				ctx.beginPath();
				ctx.rect(this.x, this.y, this.width, this.height);
				if(this.isSet){
					ctx.fillStyle = pixelTreeSetColor;
				}
				else{
					ctx.fillStyle = pixelTreeUnsetColor;
				}
				ctx.fill();
				ctx.closePath();
				this.isUpdated = true;
			}
			else{
				if(this.lazy == true){
					this.upleft.isSet = this.isSet;
					this.upleft.lazy = true;
					this.downright.isSet = this.isSet;
					this.downright.lazy = true;
					
					this.lazy = false;
				}
				this.upleft.update(ctx);
				this.downright.update(ctx);
				this.isUpdated = true;
			}
		}
	}
	
	this.makeDebugBox = function(ctx){
		this.lazyPropagation();
		if(!this.usesChildren){
			ctx.strokeStyle = pixelTreeDebugColor;
			ctx.strokeRect(this.x, this.y, this.width, this.height);
			return 1;
		}
		else{
			return this.upleft.makeDebugBox(ctx) + this.downright.makeDebugBox(ctx);
		}
	}

	this.squareInfo = function(xx, yy){
		this.lazyPropagation();
		if(xx < this.x || this.x + this.width <= xx || yy < this.y || this.y + this.height <= yy){
			return undefined;
		}
		if(!this.usesChildren){
			return this;
		}
		var rec = this.upleft.squareInfo(xx, yy);
		if(rec == undefined){
			return this.downright.squareInfo(xx, yy);
		}
		return rec;
	}

	this.toString = function(){
		this.lazyPropagation();
		return this.x+" "+this.y+" "+this.width+" "+this.height+": SUC="+[this.isSet, this.isUpdated, this.usesChildren];
	}
}


// end of document
