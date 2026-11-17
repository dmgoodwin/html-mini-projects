
// HyperbolicNode(null,-1, 5, 1);
// HyperbolicNode(v, 3);
function HyperbolicNode(acrossFrom = null, whichNeighbor = -1, numNeighbors=5, orientation = 1){
	
	this.setNeighbor = function(index, newNeighbor){
		this.neighbors[index] = newNeighbor;
		newNeighbor.neighbors[index] = this;
	}
	
	this.parentIndex = -1;
	if(acrossFrom != null) {
		this.orientation = -(acrossFrom.orientation);
		this.numNeighbors = acrossFrom.numNeighbors;
		this.seed = null;
	}
	else{
		this.numNeighbors = numNeighbors;
		this.orientation = orientation;
		this.seed = new TileSeed(EDGE_START_SEED.slice());
	}
	this.neighbors = [];
	for(let i = 0; i < this.numNeighbors; i++){
		this.neighbors[i] = null;
	}
	if(acrossFrom != null) {
		this.setNeighbor(whichNeighbor, acrossFrom);
		this.parentIndex = whichNeighbor;
	}
	this.nodeIndex = -1;
	this.matrix = null;
	if(this.orientation == 1){
		this.color = "#88cc44";
	}
	else{
		this.color = "#4488cc";
	}

	////////////////////////////////////////////////////////////////

	this.getNeighbor = function(index){
		return this.neighbors[index];
	}
	
	// orientation 1 => normal
	// orientation -1 => reverse
	this.backNeighborIndex = function(index){
		return (index + this.orientation + this.numNeighbors) % this.numNeighbors;
	}
	this.frontNeighborIndex = function(index){
		return (index - this.orientation + this.numNeighbors) % this.numNeighbors;
	}
	
	this.backNeighbor = function(index){
		return this.getNeighbor(this.backNeighborIndex(index));
	}
	this.frontNeighbor = function(index){
		return this.getNeighbor(this.frontNeighborIndex(index));
	}
	
	// yes, the function uses front; yes, this is intentional
	this.neighborAroundCornerBackwards = function(index, numCrossings=2){
		numFlips = 0;
		var retNode = this;
		if(numCrossings > 0) {
			for(;;){
				retNode = retNode.getNeighbor(index);
				numFlips++;
				if(numFlips >= numCrossings) {
					break;
				}
				index = retNode.frontNeighborIndex(index);
			}
		}
		else if(numCrossings < 0) {
			for(;;){
				retNode = retNode.getNeighbor(index);
				numFlips--;
				if(numFlips <= numCrossings) {
					break;
				}
				index = retNode.backNeighborIndex(index);
			}
		}
		return retNode;
	}
	this.neighborAroundCornerForwards = function(index, numCrossings=2){
		return this.neighborAroundCornerBackwards(index, -numCrossings);
	}
	
}

// 
function buildNodeGraph(steps=2) {
	let numNodes = 0;
	let traversalOrder = [];
	let centerNode = new HyperbolicNode(null, -1, 5, 1);
	let thisStepNodes = [centerNode];
	traversalOrder[numNodes] = centerNode;
	centerNode.nodeIndex = numNodes++;
	for(let i = 0; i < steps; i++){
		// get the nodes created last step (or a list with one node -- the center)
		
		let lastStepNodes = thisStepNodes;
		thisStepNodes = [];
		let numThisStepNodes = 0;
		console.log("Nodes on this layer:");
		console.log(lastStepNodes);
		
		// form immediate adjacent nodes
		for(let j = 0; j < lastStepNodes.length; j++){
			let u = lastStepNodes[j];
			for(let vIndex = 0; vIndex < u.numNeighbors; vIndex++){
				if(u.getNeighbor(vIndex) == null){
					let x = new HyperbolicNode(u, vIndex);
					thisStepNodes[numThisStepNodes++] = x;
					traversalOrder[numNodes] = x;
					x.nodeIndex = numNodes++;
					x.seed = new TileSeed(u.seed.flipAround(vIndex), -u.seed.orientation);
					console.log("Node <"+u.nodeIndex+"> has no "+vIndex+" neighbor. Creating neighbor <"+x.nodeIndex+">");
					//console.log(u);
				}
			}
		}
		// form corners
		for(let j = 0; j < lastStepNodes.length; j++){
			let u = lastStepNodes[j];
			for(let vIndex = 0; vIndex < u.numNeighbors; vIndex++){
				let wIndex = u.frontNeighborIndex(vIndex);
				let failAroundThruW = (u.neighborAroundCornerBackwards(wIndex) == null);
				let failAroundThruV = (u.neighborAroundCornerForwards(vIndex) == null);
				let v = u.getNeighbor(vIndex);
				let w = u.getNeighbor(wIndex);
				
				if(failAroundThruW && failAroundThruV){
					let neighbor = v.backNeighborIndex(vIndex);
					let x = new HyperbolicNode(v, neighbor);
					thisStepNodes[numThisStepNodes++] = x;
					traversalOrder[numNodes] = x;
					w.setNeighbor(w.frontNeighborIndex(wIndex), x);
					x.nodeIndex = numNodes++;
					x.seed = new TileSeed(v.seed.flipAround(neighbor), -v.seed.orientation);
					console.log("Corner at <"+u.nodeIndex+">, between <"+v.nodeIndex+"> and <"+w.nodeIndex+">, needed across "+vIndex+" and "+wIndex+". Creating neighbor <"+x.nodeIndex+">");
					//console.log(v);
					//console.log(w);
				}
				else if(failAroundThruW){
					let vCorner = u.neighborAroundCornerForwards(vIndex)
					console.log("W failed. Connecting <"+w.nodeIndex+"> and <"+vCorner.nodeIndex+"> around "+w.frontNeighborIndex(wIndex));
					// but it doesn't fail around V
					w.setNeighbor(w.frontNeighborIndex(wIndex), vCorner);
					
				}
				else if(failAroundThruV){
					let wCorner = u.neighborAroundCornerBackwards(wIndex)
					console.log("V failed. Connecting <"+v.nodeIndex+"> and <"+wCorner.nodeIndex+"> around "+v.backNeighborIndex(vIndex));
					// but it doesn't fail around W
					v.setNeighbor(v.backNeighborIndex(vIndex), wCorner);
				}
			}
		}
	}
	return traversalOrder;
}

