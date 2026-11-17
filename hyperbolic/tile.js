
let EDGE_LIMIT = 17;
let EDGE_START_SEED = [0,1,1,1,2];

function edge_inverse(edge) {
    return (EDGE_LIMIT - edge) % EDGE_LIMIT;
}

function edge_prog_inverse(prev_edge, edge) {
    return (edge + edge + prev_edge) % EDGE_LIMIT;
}

function TileSeed(seed=[], orientation=1) {
    this.seed = seed;
    this.orientation = orientation;
    this.setSeed = function(seed=[0,0,0,0,0]) { this.seed = seed; return this; }

    this.flipAround = function(i) {
        let retseed = [0,0,0,0,0];
        let noflip1 = (i-1+5) % 5;
        let noflip2 = (i+1) % 5;
        for (let j = 0; j < 5; j++) {
            if (i == j) {
                retseed[j] = edge_inverse(this.seed[j]);
            }
            else if (j == noflip1 || j == noflip2) {
                retseed[j] = this.seed[j];
            }
            else {
                retseed[j] = edge_prog_inverse(this.seed[j], this.seed[i]);
            }
        }
        return retseed;
    }

    this.getIndex = function() {
        let number = 0;
        for (let k = 0; k < 5; k++) {
            number *= EDGE_LIMIT;
            number += this.seed[k];
        }
        if (orientation == -1) {
            number = -(number + 1);
        }
        return number;
    }
}

