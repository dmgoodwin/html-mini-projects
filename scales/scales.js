var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");


var mouseX = 0, mouseY = 0;
var mouseDown = false, mouseRightDown = false;

canvas.onmousemove = function(event){
	mouseX = event.clientX;
	mouseY = event.clientY;
};
canvas.onmousedown = function(event){
	switch(event.button){
		case 0:
			mouseDown = true;
			break;
		case 2:
			mouseRightDown = true;
			break;
	}
}
canvas.onmouseout = function(event){
	mouseDown = false;
	mouseRightDown = false;
}
canvas.onmouseup = function(event){
	switch(event.button){
		case 0:
			mouseDown = false;
			break;
		case 2:
			mouseRightDown = false;
			break;
	}
}
canvas.onpointermove = canvas.onmousemove;
canvas.onpointerdown = canvas.onmousedown;
canvas.onpointerout = canvas.onmouseout;
canvas.onpointerup = canvas.onmouseup;



// todos:
// -- add screen
// -- faster way of making the dots
// -- use voronoi diagram to make regions instead of dots
// -- control how many dots there are

function Vec(x,y){
    this.x = x;
    this.y = y;

    this.distanceTo = function(that){
        return Math.hypot(this.x - that.x, this.y - that.y);
    }

    this.getX = function(){
        return this.x;
    }
    this.getY = function(){
        return this.y;
    }
}

function randomVec(minX=0, maxXExcl=512, minY = 0, maxYExcl = 512){
    let x = Math.floor(Math.random() * (maxXExcl-minX)) - minX;
    let y = Math.floor(Math.random() * (maxYExcl-minY)) - minY;
    
    let vec = new Vec(x,y);

    return vec; 
}


function PointSet(){

    this.pts = [];

    this.listGenerated = null;
    this.shouldGenerateList = true;

    this.closestPoint = function(pt){
        // for now: brute force
        let minDistance = Number.POSITIVE_INFINITY;
        let bestPoint = null;
        for(let i = 0; i < this.pts.length; i++){
            let distance = this.pts[i].distanceTo(pt);
            if(distance < minDistance){
                minDistance = distance;
                bestPoint = this.pts[i];
            }
        }
        return bestPoint;
    }

    this.distanceToClosest = function(pt){
        let closestPoint = this.closestPoint(pt);
        if(closestPoint == null){
            return Number.POSITIVE_INFINITY;
        }
        return pt.distanceTo(closestPoint);
    }

    this.addPoint = function(pt){
        this.pts[this.pts.length] = pt;
    }

    this.listOfPoints = function(){
        if(this.shouldGenerateList){
            listGenerated = this.pts.slice(0);
            this.shouldGenerateList = false;
        }
        return listGenerated;
    }

    this.closestPointIndex = function(pt){
        let listOfPoints = this.listOfPoints();
        let minDistance = Number.POSITIVE_INFINITY;
        let bestIndex = -1;
        for(let i = 0; i < this.pts.length; i++){
            let distance = this.pts[i].distanceTo(pt);
            if(distance < minDistance){
                minDistance = distance;
                bestIndex = i;
            }
        }
        return bestIndex;
    }
}

function generatePts(numPts, attemptsPerPoint=10, unacceptableDistance = 10, attemptsWhenUnacceptable=100, width=512, height=512){
    let pointSet = new PointSet();

    // make all the points
    for(let np = 0; np < numPts; np++) {
        // find the best of ten randomly-generated points
        let maxDistance = unacceptableDistance;
        let bestPoint = null;
        for(let app = 0; app < attemptsPerPoint || (bestPoint == null && app < attemptsWhenUnacceptable); app++){
            // generate the point
            let pt = randomVec(0, width, 0, height);
            // console.log(pt);
            // query for the distance between our point and the closest point already in the set
            let dist = pointSet.distanceToClosest(pt);
            // console.log(dist);
            // if higher than the maxDist recorded so far, replace it
            if(dist > maxDistance){
                maxDistance = dist;
                bestPoint = pt;
            }
        }

        // add the point
        if(bestPoint != null){
            pointSet.addPoint(bestPoint);
        }
        else{
            console.log("Failed to place point.");
            break;
        }
    }

    return pointSet;
}

////////////////////////////////////////////////////////////////////////

function Data(){
    this.numPts = 100;
    this.attemptsPerPoint = 20;
    this.attemptsWhenUnacceptable = 100;
    this.width = 1600;
    this.height = 800;
    this.ptRadius = Math.sqrt(this.width*this.height*0.1/this.numPts);

    this.pointSet = null;

    this.totalClicks = 0;
    this.whichClicked = -1;
    this.numClicks = [];
    this.numFramesAgo = [];
    this.graceFrames = 60;
    this.hasWon = false;
    this.hasLost = false;

    this.gen_ = function(){
        this.pointSet = generatePts(this.numPts, this.attemptsPerPoint, this.ptRadius, this.attemptsWhenUnacceptable, this.width, this.height);
        for(let i = 0; i < this.numPts; i++){
            this.numClicks[i] = 0;
            this.numFramesAgo[i] = 0;
        }
        return this;
    }

    this.getNormalColor = function(){
        return "#4488cc";
    }

    this.getPressedColor = function(){
        return "#aaccee";
    }

    this.getReleasedColor = function(){
        return "#ee8800";
    }

    this.getWinColor = function(){
        return "#22ff44";
    }

    this.getLoseCulpritColor = function(){
        return "#ff6666";
    }

    this.getLosePressedColor = function(){
        return "#cc3333";
    }

    this.getLoseUnpressedColor = function(){
        return "#440000";
    }

    this.getRegionColor = function(index){
        if(this.hasWon){
            return this.getWinColor();
        }
        if(this.hasLost){
            if(this.numClicks[index] > 1){
                return this.getLoseCulpritColor();
            }
            if(this.numClicks[index] < 1){
                return this.getLoseUnpressedColor();
            }
            return this.getLosePressedColor();
        }
        if(this.whichClicked == index){
            return this.getPressedColor();
        }
        if(this.numClicks[index] == 1){
            this.numFramesAgo[index]++;
            if(this.numFramesAgo[index] < this.graceFrames){
                return this.getReleasedColor();
            }
        }
        return this.getNormalColor();
    }
}

var applicationData = new Data().gen_();

function drawPoints(ctx,pointSet,data){
    let xspace = (canvas.width - data.width) * 0.5;
    let yspace = (canvas.height - data.height) * 0.5;
    let listOfPts = pointSet.listOfPoints();
    for(let i = 0; i < listOfPts.length; i++){
        let pt = listOfPts[i];
        
		ctx.beginPath();
		ctx.arc(
			xspace + pt.getX(),
			canvas.height - yspace - pt.getY(),
			data.ptRadius, 0, 2*Math.PI, false
		);
        
		ctx.fillStyle = data.getRegionColor(i);
		ctx.fill();
    }
}

function clickEvents(data){
    let xspace = (canvas.width - data.width) * 0.5;
    let yspace = (canvas.height - data.height) * 0.5;

    let mouseVec = new Vec(mouseX - xspace, canvas.height - yspace - mouseY);
    let closest = data.pointSet.closestPointIndex(mouseVec);
    let distance = data.pointSet.listOfPoints()[closest].distanceTo(mouseVec);

    ctx.beginPath();
    ctx.arc(
        xspace + mouseVec.getX(),
        canvas.height - yspace - mouseVec.getY(),
        3, 0, 2*Math.PI, false
    );
    
    ctx.fillStyle = "#000000";
    ctx.fill();

    if(mouseDown){
        if(data.whichClicked == -1){//} && distance <= data.ptRadius){
            data.whichClicked = closest;
        }
        else{
            if(closest != data.whichClicked){//} || distance > data.ptRadius){
                data.whichClicked = -2;
            }
        }
    }
    else{
        if(data.whichClicked >= 0){
            data.numClicks[data.whichClicked]++;
            data.totalClicks++;
            if(data.numClicks[data.whichClicked] > 1){
                if(!data.hasWon && !data.hasLost){
                    data.hasLost = true;
                }
            }
            if(data.totalClicks >= data.numPts){
                if(!data.hasWon && !data.hasLost){
                    data.hasWon = true;
                }
            }
        }
        data.whichClicked = -1;
    }
    
}

function draw(){
    clickEvents(applicationData);

    ctx.clearRect(0,0,canvas.width,canvas.height);
    drawPoints(ctx, applicationData.pointSet, applicationData);

    let xspace = (canvas.width - applicationData.width) * 0.5;
    let yspace = (canvas.height - applicationData.height) * 0.5;

    requestAnimationFrame(draw);
}

draw()
