
let randBetween = function(a, b) {
    return Math.floor((Math.random() * (b-a))) + a;
}
let equalZero = function(val){
    if(val == 0.0) return true;
    if(val == -0.0) return true;
    return false;
}

// mathematical definition of a 2d point
// PLUS some Guibas-Stolfi-related metadata
function Vec(x, y, dex=-1){
    this.x = x;
    this.y = y;
    this.dex = dex; // unique among Vec objects, if not -1
    
    // this Guibas-Stolfi implementation assumes that arcs of the same start Vec
    // point to each other in a looped list, and that said start Vec can traverse
    // these outgoing arcs using said looped 
    // in theory, a Vec's "last" arc is its outoing arc immediately clockwise of
    // said Vec's "first" arc, i.e. counterclockwise is increasing order.
    // in practice, X and Y axes are flipped in this app.
    this.firstArc = null;
    
    this.turnFirst = function(){
        if(this.firstArc != null) this.firstArc = this.firstArc.next;
    }
    this.turnLast = function(){
        if(this.firstArc != null) this.firstArc = this.firstArc.prev;
    }
    this.peekFirst = function(){
        return this.firstArc; // can be null
    }
    this.peekLast = function(){
        if(this.firstArc == null) return null;
        return this.firstArc.prev;
    }

    this.basicInsert = function(arc){
        if(this.firstArc == null){
            arc.next = arc;
            arc.prev = arc;
            this.firstArc = arc;
        }
        else{
            let prevFirst = this.firstArc;
            let prevLast = this.firstArc.prev;
            prevFirst.prev = arc; arc.next = prevFirst;
            prevLast.next = arc; arc.prev = prevLast;
        }
    }

    this.addFirst = function(arc){
        this.basicInsert(arc);
        this.turnLast();
    }
    this.addLast = function(arc){
        this.basicInsert(arc);
    }

    // from v to one of this' neighbors
    this.leftmostNeighbor = function(v, actuallyRight = false){
        if(this.firstArc == null) return null;
        let maxCross = 0.0;
        let ret = null;
        let firstArc = this.firstArc;
        
        do{
            let arc = this.firstArc
            let comp = actuallyRight? v.cross(arc.to, this): v.cross(this, arc.to);
            if(comp > maxCross){
                maxCross = comp; ret = arc.to;
            } else if(maxCross == 0.0 && equalZero(comp) && this.dot(v, arc.to) > 0.0){
                ret = arc.to;
            }
            // ...
            this.turnFirst();
        } while(this.firstArc != firstArc);

        return ret;
    }

    // does not handle degenerate (i.e. 0) angles. handles 180 degree angles
    this.insertable = function(v){
        if(this.firstArc == null || this.firstArc.prev == this.firstArc) return true;

        let fi = this.firstArc.to; let la = this.firstArc.prev.to;
        if(this.cross(la, fi) > 0.0){
            return this.cross(la, v) >= -0.0 && this.cross(v, fi) >= -0.0;
        } return this.cross(la, v) >= -0.0 || this.cross(v, fi) >= -0.0;
    }

    this.prepareInsert = function(arc, actuallyTurnLast = false){
        for(;!this.insertable(arc.to);) this.turnFirst();
    }

    this.add = function(v){
        return new Vec(this.x + v.x, this.y + v.y);
    }

    this.sub = function(v){
        return new Vec(this.x - v.x, this.y - v.y);
    }

    // square magnitude from another point
    this.dist2 = function(v){
        return (this.x-v.x)**2 + (this.y-v.y)**2;
    }

    this.scale = function(d){
        return new Vec(this.x * d, this.y * d); 
    }

    // "clockwise" -- but appears counterclockwise in our app
    // because X axis and Y axis are flipped.
    this.cw = function(){
        return new Vec(this.y, -this.x);
    }

    this.dot = function(a, b){
        return (a.x - this.x) * (b.x - this.x) + (a.y - this.y) * (b.y - this.y);
    }

    this.cross = function(a, b=null){
        if(b != null){
            return (a.x - this.x) * (b.y - this.y) - (a.y - this.y) * (b.x - this.x);
        }
        return this.x * a.y - a.x * this.y;
    }

    this.mag2 = function(){
        return x*x + y*y;
    }
}

let drawVec = function(ctx, vec, radius=4, fillStyle="#ee1188"){
    ctx.beginPath();
    ctx.arc(vec.x, vec.y, radius, 0, 2*Math.PI, false);
    ctx.fillStyle = fillStyle;
    ctx.fill();
}

// represents that points (a,b) are connected via a line.
// there are two arcs per connected points -- (a,b) of one is (b,a) of the other
// in an actual production that uses this,
// we'd clear a, b, to, and inv when done, so that garbage collection doesn't skip it
function Arc(a, b = null, start = -1, end = Number.MAX_VALUE){
    this.cccc = null; // unused
    this.next = this;
    this.prev = this;
    this.cancelled = false;
    this.start = -1;
    this.end = Number.MAX_VALUE;

    if(b == null){
        this.to = a;
    }
    else{
        this.to = b;
        this.inv = new Arc(a);
        this.inv.inv = this;
        a.prepareInsert(this);
        a.addLast(this);
        b.prepareInsert(this.inv);
        b.addFirst(this.inv);
    }

    this.remove = function(goTheOtherWayToo = true){
        // check whether we are the head
        if(this.inv.to.firstArc == this){
            this.inv.to.turnFirst();
        }
        if(this.inv.to.firstArc == this){
            this.inv.to.firstArc = null;
        }
        this.next.prev = this.prev;
        this.prev.next = this.next;
        if(goTheOtherWayToo){
            this.inv.remove(false);
        }
        this.cancelled = true;
        this.inv.cancelled = true;
    }

    this.setCreatedStep = function(val, goTheOtherWayToo = true){
        this.start = val;
        if(goTheOtherWayToo) this.inv.setCreatedStep(val, false);
        return this;
    }

    this.setDestroyedStep = function(val, goTheOtherWayToo = true){
        this.end = val;
        if(goTheOtherWayToo) this.inv.setDestroyedStep(val, false);
        return this;
    }
}

let inCC = function(a, b, c, d){
    if(a == d || b == d || c == d) return false;
    let x1 = b.x-a.x;
    let y1 = b.y-a.y;
    let z1 = x1*x1 + y1*y1;
    let x2 = c.x-a.x;
    let y2 = c.y-a.y;
    let z2 = x2*x2 + y2*y2;
    let x3 = d.x-a.x;
    let y3 = d.y-a.y;
    let z3 = x3*x3 + y3*y3;
    // very precision intensive step
    return x3 * (y1*z2 - z1*y2) + y3 * (z1*x2 - x1*z2) + z3 * (x1*y2 - y1*x2) < -0.0;
}

// where 'a' is a Vec in one triangulation and 'b' is a Vec in the other
// we repeatedly say:
// - set b to the clockwise-most point from a's perspective
// - set a to the counterclockwise-most point from b's perspective
// and we stop when neither a nor b change anymore.
// then (a,b) is on the convex hull between the two triangulations.
// i'm pretty sure this is O(N), but i haven't proved it yet.
let baseline = function(a, b){
    for(let again = true; again;) {
        // looping back through this loop necessitates trying the whole thing
        for(again = false;; again = true){
            let prop = a.leftmostNeighbor(b, false);
            if(prop == null) break;
            a = prop;
            // console.log("Another loop through the left baseline");
        }
        for(;; again = true){
            let prop = b.leftmostNeighbor(a, true);
            if(prop == null) break;
            b = prop;
            // console.log("Another loop through the right baseline");
        }
        // console.log("Another loop through the baseline");
    }
    return [a,b];
}

// this class is not really part of the algorithm mathematically.
// its purpose is to make it easier to display the steps taken by the algorithm,
// hence all the drawing stuff in here.
function Split(a=null, b=null, start=-1, end=Number.MAX_VALUE){
    this.a = a;
    this.b = b;
    this.start = start;
    this.end = end;
    this.lowerChild = null;
    this.upperChild = null;
    this.decisionOrder = [];
    this.actualEnd = end;

    this.registerAsChildOf = function(par){
        if(par != null){
            // sometimes duds need to be inserted for it to work correctly
            if(par.lowerChild == null){
                par.lowerChild = this;
            }
            else if(par.upperChild == null){
                par.upperChild = this;
            }
        }
        this.end = this.start;
        return this;
    }

    this.addToDecisionOrder = function(vec){
        this.decisionOrder[this.decisionOrder.length] = vec;
        this.end++;
        return this;
    }

    this.drawSplit = function(ctx, color, width=1){
        let mid = this.a.add(this.b).scale(0.5);
        let p1 = b.sub(mid).cw().add(mid);
        let p2 = a.sub(mid).cw().add(mid);

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineWidth = width;
        ctx.strokeStyle = color;
        ctx.stroke();
    }
    
    this.frameOfChildrenEnd = function(){
        if(this.upperChild != null){
            return this.upperChild.actualEnd;
        }
        if(this.lowerChild != null){
            return this.lowerChild.actualEnd;
        }
        return this.start + this.decisionOrder.length;
    }
    
    this.drawVecsInColor = function(ctx, color="#888888"){
        for(let i = 0; i < this.decisionOrder.length; i++){
            drawVec(ctx, this.decisionOrder[i], 2, color);
        }
    }

    this.drawSplitsRecursive = function(ctx, frame=-1, includeVecs=true, includeSplits=true){
        if(this.a == null && this.b == null){
            if(this.lowerChild != null){
                this.lowerChild.drawSplitsRecursive(ctx, frame, includeVecs, includeSplits);
            }
            return;
        }
        let afterMyStart = (this.start <= frame);
        let beforeMyEnd = (frame < this.end);
        let afterUpperEnd = (this.frameOfChildrenEnd() <= frame);

        if(includeSplits && !afterUpperEnd){
            if(beforeMyEnd){
                
                this.drawSplit(ctx, "#cc33cc", 3);
            }
            else {
                this.drawSplit(ctx, "#cc33cc", 1);
            }
        }

        // events here?
        if(beforeMyEnd || afterUpperEnd){

            // yes
            // first draw the split if we need to
            if(includeSplits && beforeMyEnd && afterMyStart){
                // this.drawSplit(ctx);
            }
            
            if(includeVecs){
                // then loop thru the elements of decisionOrder to draw verts
                for(let i = 0; i < this.decisionOrder.length; i++){
                    if(i + this.start == frame){
                        drawVec(ctx, this.decisionOrder[i], 9, "#44cc44");
                    }
                    if(this.a == this.decisionOrder[i] || this.b == this.decisionOrder[i]){
                        drawVec(ctx, this.decisionOrder[i], 6, "#cc6622");
                    }
                    else if(i + this.start < frame && this.decisionOrder[i].sub(this.a).mag2() > this.decisionOrder[i].sub(this.b).mag2()){
                        drawVec(ctx, this.decisionOrder[i], 2, "#4444cc");
                    }
                    else{
                        drawVec(ctx, this.decisionOrder[i], 3);
                    }
                }
            }
        }
        else{
            if(this.lowerChild != null) {
                let afterLowerEnd = (this.lowerChild.actualEnd <= frame);
                if(afterLowerEnd){
                    this.lowerChild.drawVecsInColor(ctx);
                }
                else{
                    this.lowerChild.drawSplitsRecursive(ctx, frame, includeVecs, includeSplits);
                }
            }
            if(this.upperChild != null){
                let beforeUpperStart = (frame < this.upperChild.start);
                if(beforeUpperStart){
                    this.upperChild.drawVecsInColor(ctx, "#4444cc");
                }
                else{
                    this.upperChild.drawSplitsRecursive(ctx, frame, includeVecs, includeSplits);
                }
            }
            if(this.lowerChild == null && this.upperChild == null){
                this.drawVecsInColor(ctx, "#ff00ff");
            }
        }
    }
}

function drawArcs(ctx, arcs=[], atStep=Number.MAX_SAFE_INTEGER){
    for(let i = 0; i < arcs.length; i++){
        // if(arcs[i].cancelled) continue;
        if(arcs[i].start <= atStep && atStep < arcs[i].end){
            ctx.beginPath();
            ctx.moveTo(arcs[i].to.x, arcs[i].to.y);
            ctx.lineTo(arcs[i].inv.to.x, arcs[i].inv.to.y);
            ctx.lineWidth = 2;
            ctx.strokeStyle = "#8811ee";
            ctx.stroke();
        }
    }
}

function drawVecs(ctx, vecs=[]) {
    for(let i = 0; i < vecs.length; i++){
        drawVec(ctx, vecs[i]);
    }
}

function drawArcsAndVecs(ctx, arcs, vecs=null, atStep=Number.MAX_SAFE_INTEGER, splitTree=null){
    drawArcs(ctx, arcs, atStep);
    
    if(vecs != null){
        drawVecs(ctx, vecs);
    }
    else if(splitTree != null){
        splitTree.drawSplitsRecursive(ctx, atStep, true, true);
    }
}

function getLastCreatedStep(arcs=[]){
    if(arcs.length == 0){
        return -1;
    }
    return arcs[arcs.length-1].start;
}

function StepCounter(startVal=0){
    this.val = startVal;

    this.tick = function(){
        this.val = this.val+1;
        return this.val-1;
    }

    this.peek = function(){
        return this.val;
    }
}

// THE ALGORITHM (given a set of points 'vecs')
// - if vecs has two or fewer points (trivial case)
// - - handle it manually and return.
// - pick two random points in the set, a and b
// - split the points in vecs into two sets, groupA and groupB
// - - each point in groupA is closer to a
// - - each point in groupB is closer to b
// - recursively run the algorithm on (groupA) and (groupB)
// - (base, summit) <- find the two line segments connecting groupA and groupB, which are on the convex hull of vecs
// - (lo, hi) <- base
// - while (lo, hi) is not the summit:
// - - remove line segments in lo's line segment list which can't be in the triangulation
// - - remove line segments in hi's line segment list which can't be in the triangulation
// - - find the next triangle. add the missing line segment, and advance lo or hi accordingly.
// - return

// make sure these vecs can take being expanded
// and also that no two points are the same point, ever
function guibasStolfi(vecs=[], arcs=[], vecsUnrecursive=null, ctx=null, stepCounter=null, parentSplit=null) {
    if(stepCounter == null){
        stepCounter = new StepCounter();
    }
    if(vecsUnrecursive == null){
        arcs = guibasStolfi(vecs, arcs, vecs, ctx, stepCounter, parentSplit);
        return arcs;
    }
    if(vecs.length < 2){
        if(vecs.length == 1){
            let split = new Split(vecs[0], vecs[0], stepCounter.peek(), stepCounter.peek()).registerAsChildOf(parentSplit);
            split.decisionOrder = vecs;
        }
        return arcs;
    }
    if(vecs.length == 2){
        let split = new Split(vecs[0], vecs[1], stepCounter.peek(), stepCounter.peek()).registerAsChildOf(parentSplit);
        split.decisionOrder = vecs;

        let arc = new Arc(vecs[0], vecs[1]);
        arc.setCreatedStep(stepCounter.tick());
        arcs[arcs.length] = arc;

        return arcs;
    }

    let a = randBetween(0, vecs.length);
    let b = randBetween(0, vecs.length-1);
    if(b >= a) b++;
    else{ let temp = a; a = b; b = temp; }
    let threshold = vecs[a].dot(vecs[b], vecs[b]) * 0.5;
    
    let split = new Split(vecs[a], vecs[b], stepCounter.peek()).registerAsChildOf(parentSplit);

    // console.log("a "+a+", b "+b);
    // closer to a -> split into a's group
    // closer to b -> split into b's group
    let groupA = [];
    let groupB = [];

    for(let i = 0; i < vecs.length; i++){
        split.addToDecisionOrder(vecs[i]);
        stepCounter.tick();

        if(vecs[a].dot(vecs[b], vecs[i]) < threshold){
            groupA[groupA.length] = vecs[i];
        }
        else{
            groupB[groupB.length] = vecs[i];
        }
    }

    // console.log("length of A is "+groupA.length+"; length of B is "+groupB.length); 
    arcs = guibasStolfi(groupA, arcs, vecsUnrecursive, ctx, stepCounter, split);
    arcs = guibasStolfi(groupB, arcs, vecsUnrecursive, ctx, stepCounter, split);

    let base = baseline(vecs[a], vecs[b]);
    let summit = baseline(vecs[b], vecs[a]);
    // console.log(base[0].dex+" "+base[1].dex);
    // console.log(summit[1].dex+" "+summit[0].dex);
    
    let lo = base[0], hi = base[1];

    arcs[arcs.length] = new Arc(lo, hi).setCreatedStep(stepCounter.tick());

    for(let numTrianglesPlaced = 0;; numTrianglesPlaced++){
        if(lo == summit[1] && hi == summit[0]){
            split.actualEnd = stepCounter.peek();
            return arcs;
        }
        lo.turnFirst(); hi.turnLast();
        let loSubmit = false, hiSubmit = false, rUp;

        while(lo.peekFirst() != lo.peekLast()){ // left side
            // if(lo == summit[1]) break;

            if(lo.cross(hi, lo.peekLast().to) <= 0.0) break;
            if(inCC(lo, lo.peekLast().to, lo.peekFirst().to, hi)){
                let offending = lo.peekLast();
                offending.setDestroyedStep(stepCounter.tick());
                offending.remove();
                lo.turnFirst();
                
            } else{
                loSubmit = true;
                break;
            }
            // console.log("Deleted edge on Lo side");
        }

        while(hi.peekFirst() != hi.peekLast()){
            // if(hi == summit[0]) break;
            
            if(hi.cross(hi.peekFirst().to, lo) <= 0.0) break;
            if(inCC(hi, hi.peekLast().to, hi.peekFirst().to, lo)){
                let offending = hi.peekFirst();
                offending.setDestroyedStep(stepCounter.tick());
                offending.remove();
                hi.turnLast();
            } else{
                hiSubmit = true;
                break;
            }
            // console.log("Deleted edge on Hi side");
        }

        if(loSubmit && hiSubmit){
            rUp = inCC(lo, hi, lo.peekLast().to, hi.peekFirst().to);
        } else if(loSubmit || hiSubmit){
            rUp = hiSubmit; // this isn't weird; hiSubmit is a boolean
        } else{
            alert("precision error");
            let arc = new Arc(summit[0], summit[1]);
            arc.setCreatedStep(stepCounter.tick());
            arcs[arcs.length] = arc;
            return arcs;
        }

        if(rUp){
            hi = hi.peekFirst().to;
            // console.log("Advancing hi");
        }
        else{
            lo = lo.peekLast().to;
            // console.log("Advancing lo");
        }
        arcs[arcs.length] = new Arc(lo, hi).setCreatedStep(stepCounter.tick());
    }
}










