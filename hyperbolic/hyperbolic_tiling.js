// prerequisites
// hyperbolic_geom.js
// tiling.js

function basisPentagonHalfwayPoint(){
    // to get a right pentagon in beltrami-klein:
    // -> draw a five-pointed star centered at origin
    // -> 1/A distance from center to point -- first point at (1/A, 0)
    // -> coordinate of star 72 degrees from that is (A, B/A) so that:
    // - -> (A + Bi/A)^5 = 1
    // - -> (A^2 + Bi)^5 = 1
    // -> find the fifth route so that (a+Bi)^5 -> 5
    let a = Math.cos(2 * Math.PI / 5);
    // -> A = sqrt(a)
    let A = Math.sqrt(a);

    // you now have a distance, A, by which to travel in Euclidean
    // project (A,0) into Beltrami-Klein to get point C
    let C = new HomoVec(A, 0).normalize_();
    return C;
}

function basisPentagonNeighborCenter(){
    // project (-A,0) into Beltrami-Klein to get point D
    let C = basisPentagonHalfwayPoint();
    let D = HomoVec_copy(C).flipXY();

    // find global-to-local matrix of D -> 0toD
    let OtoD = new HomoRot().globalToLocal_(D);

    // pass C thru 0_D to get C_D
    let C_D = OtoD.dotVec(C);

    // ### C_D is the point you want
    return C_D;
}

// need to make lines
function basisPentagonBorder(){
    
    let C = basisPentagonHalfwayPoint();
    // only along x and z

    C.x = 1/C.x;
    return C;
}


// need to use the tiling graph
// ok, even tiles will be given parity s.t. its relative centers are at angles
// 0, 2pi/5, 4pi/5, 6pi/5, 8pi/5
// and odd tiles will be s.t. its relative centers are at angles
// 1pi/5, 3pi/5, pi, 7pi/5, 9pi/5 in backwards order
// rule: the X axis of each pentagon points directly toward its 0 edge
// so for evens, going across ___ means rotating ___ after translating:
// - 0; 5pi/5
// - 1; 9pi/5
// - 2; 3pi/5
// - 3; 7pi/5
// - 4; 1pi/5
// for evens: (4*index + 5)pi/5
// for odds: (-4*index + 5)pi/5
// so: translate, then rotate

function HyperbolicPentagonTiling(numSteps=2){

    // build the graph
    this.nodeGraph = buildNodeGraph(numSteps);

    // get the basic geom for this
    this.basisNeighborCenter = basisPentagonNeighborCenter();
    this.basisDividingLine = basisPentagonHalfwayPoint().getAcrossUnitCircle();

    this.neighborCenters = [this.basisNeighborCenter, null, null, null, null];
    this.dividingLines = [this.basisDividingLine, null, null, null, null];
    this.corners = [null, null, null, null, null];

    for(let i = 1; i < 5; i++){

        let C = Math.cos(2*Math.PI*i / 5);
        let S = Math.sin(2*Math.PI*i / 5);

        this.neighborCenters[i] = new HomoVec(C*this.basisNeighborCenter.x, S*this.basisNeighborCenter.x, this.basisNeighborCenter.z);
        this.dividingLines[i] = new HomoVec(C*this.basisDividingLine.x, S*this.basisDividingLine.x, this.basisDividingLine.z);
    }

    for(let i = 0; i < 5; i++) {

        this.corners[i] = this.dividingLines[i].outer_product(this.dividingLines[(i+1)%5]);
    }

    ///////////////////////////////////////////////////////////////

    // do this in order!
    // this takes the list of tiles and gives them each a rotation matrix
    // not pentagon vertices (yet)
    this.loadMatrix = function(tileNode) {

        if(tileNode.parentIndex == -1){

            tileNode.matrix = new HomoRot();
        }
        else{
            let i = tileNode.parentIndex;
            
            let R = null;
            let T = null;
            // [rotation] [translation] [previous]
            if(tileNode.orientation == 1){

                R = new HomoRot().rotation_((5 - 4*i)*Math.PI/5);
                T = new HomoRot().globalToLocal_(this.neighborCenters[(5-i)%5]);
            }
            else {
                
                R = new HomoRot().rotation_((4*i - 5)*Math.PI/5);
                T = new HomoRot().globalToLocal_(this.neighborCenters[i]);
            }
            
            let RT = R.dotRot(T);
            let M = tileNode.getNeighbor(i).matrix;
            tileNode.matrix = RT.dotRot(M).normalize();
        }
    }

    for(let j = 0; j < this.nodeGraph.length; j++){

        this.loadMatrix(this.nodeGraph[j]);
    }
}

