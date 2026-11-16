// MUST have module-PixelTree as part of the imports in the html file

// setTimeout(func, millis)
// setInterval(func, millis)
var canvas1 = document.getElementById("canvas1");
var canvas2 = document.getElementById("canvas2");
var ctx1 = canvas1.getContext("2d");
var ctx2 = canvas2.getContext("2d");


var mouseX = 0, mouseY = 0, mouseZ = 0;
var mouseDown = false, mouseWheelDown = false, mouseRightDown = false;
// canvas2.addEventListener('click', function(events){
// 	mouseX = events.clientX;
// 	mouseY = events.clientY;
// });
canvas2.onmousemove = function(event){
	mouseX = event.clientX;
	mouseY = event.clientY;
};
canvas2.onmousedown = function(event){
	switch(event.button){
		case 0:
			mouseDown = true;
			break;
		case 1:
			mouseWheelDown = true;
			break;
		case 2:
			mouseRightDown = true;
			break;
	}
}
canvas2.onmouseout = function(event){
	mouseDown = false;
	mouseWheelDown = false;
	mouseRightDown = false;
}
canvas2.onmouseup = function(event){
	switch(event.button){
		case 0:
			mouseDown = false;
			break;
		case 1:
			mouseWheelDown = false;
			break;
		case 2:
			mouseRightDown = false;
			break;
	}
}
canvas2.onwheel = function(event){
	var amt = (event.wheelDelta / 120);
	mouseZ += amt*amt*amt;
}
document.onkeypress = function(events){
    let x = events.which || events.keyCode;
    if(String.fromCharCode(x) == "a"[0]){
        drawPixelTree = !drawPixelTree;
        console.log("flip");
    }
}

var squareInfo = "";
var numBoxes = 0;
var squareInQuestion = undefined;
function drawInfo(){
	var amtLines = 0;
	ctx2.font = "16px Verdana";
	if(numBoxes != undefined){
		ctx2.fillStyle = "#0000FF";
		ctx2.fillText("number of boxes: "+numBoxes, 8, 20 + 20*(amtLines++));
		ctx2.fillText("efficiency: "+(pixelTree.width*pixelTree.height / (numBoxes*2-1)), 8, 20 + 20*(amtLines++));
	}
	ctx2.fillStyle = "#FF0000";
	ctx2.fillText(mouseX+", "+mouseY+" "+mouseZ+" is the "+(mouseDown? "pressed": "unpressed")+" mouse", 8, 20 + 20*(amtLines++));
	ctx2.fillStyle = "#00FF00";
	squareInQuestion = pixelTree.squareInfo(mouseX, mouseY);
	ctx2.fillText(squareInQuestion+", "+(squareInQuestion != undefined? squareInQuestion.upleft: null), 8, 20 + 20*(amtLines++));
	
}

function drawABox(ctx){
	ctx.beginPath();
	ctx.rect(50, 50, 10, 10);
	ctx.fillStyle = "#000000";
	ctx.fill();
	ctx.closePath();
}

var drawPixelTree = false;
var pixelTree = new PixelTree(0, 0, canvas1.width, canvas1.height, 2);
//pixelTree.set(200, 200, 500, 300, true);

function drawCursor(){
	ctx2.strokeStyle = "#888888";
	ctx2.lineWidth = 1;
	ctx2.strokeRect(mouseX - mouseZ/2, mouseY - mouseZ/2, mouseZ, mouseZ);
}

function mouseEvents(){
	if(mouseDown){
		if(mouseZ > 0){
			pixelTree.set(mouseX - mouseZ/2, mouseY - mouseZ/2, mouseZ, mouseZ, true);
		}
		else if(mouseZ < 0){
			var mouseZ2 = -mouseZ;
			pixelTree.set(mouseX - mouseZ2/2, mouseY - mouseZ2/2, mouseZ2, mouseZ2, false);
		}
	}
}

function draw(){
	squareInfo = "";
	ctx2.clearRect(0,0,canvas2.width,canvas2.height);
	//console.log(document.body.clientWidth);
	//canvas2.width = 500;
	//console.log(document.clientWidth +" "+ document.clientHeight);
	//ctx2.height = document.clientHeight;
	mouseEvents();

	pixelTree.update(ctx1);
	if(drawPixelTree){
		numBoxes = pixelTree.makeDebugBox(ctx2);
	}
	else{
		numBoxes = undefined;
	}
	drawInfo();

	drawCursor();
	
	requestAnimationFrame(draw);
}
	
draw();

// end of document
