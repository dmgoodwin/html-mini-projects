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