

function HomoVec(x,y,z=1.0){

    this.x = x;
    this.y = y;
    this.z = z;

    this.flipXY = function(){

        this.x = -this.x;
        this.y = -this.y;
        return this;
    }

    this.plus = function(that){

        return new HomoVec(
            this.x + that.x,
            this.y + that.y,
            this.z + that.z
        );
    }

    this.minus = function(that){

        return new HomoVec(
            this.x - that.x,
            this.y - that.y,
            this.z - that.z
        );
    }

    // this is NOT correct for hyperbolic space.
    this.dot = function(that){

        return this.z*that.z + this.x*that.x + this.y*that.y;
    }

    this.inner_product = function(that){

        return this.z*that.z - this.x*that.x - this.y*that.y;
    }

    this.outer_product = function(that){

        // the z is flipped
        return new HomoVec(
            this.y*that.z - this.z*that.y,
            this.z*that.x - this.x*that.z,
            that.x*this.y - that.y*this.x
        );
    }

    this.distFrom = function(that){

        let dot = a.inner_product(b);
        if(dot >= 1.0){

            return Math.acosh(dot);
        }
        return 0.0;
    }

    this.magnitude = function(that){

        return Math.sqrt(Math.abs(this.inner_product(this)));
    }

    this.normalize = function(){

        let magnitude = this.magnitude();
        return new HomoVec(
            this.x / magnitude,
            this.y / magnitude,
            this.z / magnitude
        );
    }

    this.normalize_ = function(){

        let magnitude = this.magnitude();
        this.x /= magnitude;
        this.y /= magnitude;
        this.z /= magnitude;
        return this;
    }

    /////////////////////////////////////////////////////////////////
    // TRANSLATIONS BETWEEN COORDINATE SYSTEMS

    this.beltramiKleinX = function(){

        return this.x / this.z;
    }
    this.beltramiKleinY = function(){

        return this.y / this.z;
    }
    
    this.fromBeltramiKlein_ = function(){
        
        this.normalize_();
        return this;
    }

    this.poincareX = function(){
        return this.x / (this.z-1);
    }
    this.poincareY = function(){
        return this.y / (this.z-1);
    }
    
    this.fromPoincare_ = function(){
        this.z = 1 + this.x**2 + this.y**2;
        this.x *= 2;
        this.y *= 2;
        return this;
    }

    this.betweenBPX = function(t){
        
        return this.x / (this.z-t);
    }

    this.betweenBPY = function(t){
        
        return this.y / (this.z-t);
    }

    this.getAcrossUnitCircle = function(){
        let hypot = Math.hypot(this.x, this.y);
        return new HomoVec(this.x*this.z/hypot, this.y*this.z/hypot, hypot);
    }
}

function HomoVec_copy(homovec){

    return new HomoVec(homovec.x, homovec.y, homovec.z);
}

function HomoRot(xx=1, xy=0, xz=0, yx=0, yy=1, yz=0, zx=0, zy=0, zz=1){

    this.xx = xx; this.xy = xy; this.xz = xz;
    this.yx = yx; this.yy = yy; this.yz = yz;
    this.zx = zx; this.zy = zy; this.zz = zz;


    this.rotation_ = function(angle){

        this.xx = Math.cos(angle);
        this.xy = Math.sin(angle);
        this.yx = -this.xy;
        this.yy = this.xx;

        return this;
    }

    // only set normalizeFirst to false if you know you're passing in a normalized vector
    this.globalToLocal_ = function(homovec, normalizeFirst=true){

        if(normalizeFirst){

            homovec = homovec.normalize();
        }

        let x = homovec.x;
        let y = homovec.y;
        let z = homovec.z;
        
        let Sh2 = x*x + y*y;
        if(Sh2 == 0){
            return this;
        }
        let Sh = Math.sqrt(x*x + y*y);
        
        this.xx = (z*x*x + y*y) / Sh2;
        this.xy = (x*y*(z - 1)) / Sh2;
        this.xz = -x;
        this.yx = this.xy;
        this.yy = (z*y*y + x*x)/Sh2;
        this.yz = -y;
        this.zx = -x;
        this.zy = -y;
        this.zz = z;
        return this;
    }

    // there's nothing scientific about this function.
    // i just don't want my matrix values to explode.
    this.precisify_ = function() {
        
        let max = Math.max(this.xx, this.xy, this.xz, this.yx, this.yy, this.yz, this.zx, this.zy, this.zz);
        let min = Math.min(this.xx, this.xy, this.xz, this.yx, this.yy, this.yz, this.zx, this.zy, this.zz);
        let factor = 2**(-Math.floor(Math.log2(Math.max(max, -min))));
        
        this.xx *= factor;
        this.xy *= factor;
        this.xz *= factor;
        this.yx *= factor;
        this.yy *= factor;
        this.yz *= factor;
        this.zx *= factor;
        this.zy *= factor;
        this.zz *= factor;
        return this;
    } 

    this.localToGlobal_ = function(homovec, normalizeFirst=true){

        this.globalToLocal_(homovec, normalizeFirst);
        this.xz *= -1;
        this.yz *= -1;
        this.zx *= -1;
        this.zy *= -1;
        return this;
    }

    this.dotVec = function(vec){
        
        return new HomoVec(
            this.xx*vec.x + this.xy*vec.y + this.xz*vec.z,
            this.yx*vec.x + this.yy*vec.y + this.yz*vec.z,
            this.zx*vec.x + this.zy*vec.y + this.zz*vec.z
        );
    }

    this.dotRot = function(that){

        let ret = new HomoRot(
            this.xx * that.xx + this.xy * that.yx + this.xz * that.zx,
            this.xx * that.xy + this.xy * that.yy + this.xz * that.zy,
            this.xx * that.xz + this.xy * that.yz + this.xz * that.zz,
            this.yx * that.xx + this.yy * that.yx + this.yz * that.zx,
            this.yx * that.xy + this.yy * that.yy + this.yz * that.zy,
            this.yx * that.xz + this.yy * that.yz + this.yz * that.zz,
            this.zx * that.xx + this.zy * that.yx + this.zz * that.zx,
            this.zx * that.xy + this.zy * that.yy + this.zz * that.zy,
            this.zx * that.xz + this.zy * that.yz + this.zz * that.zz
        );
		
        return ret;
    }

    this.rtDecomp = function(){
        // [-zx -zy] [ C]   [ xz]
        // [-zy  zx] [ S] = [ yz]
        // is the matrix
        // [zx  zy  xz] cross
        // [zy -zx  yz]
        let x = this.zy*this.yz + this.zx*this.xz;
        let y = this.xz*this.zy - this.zx*this.yz;

        let hypot = Math.hypot(x,y);
        let C = -1., S = -1.;

        if(hypot > 0) {
            
            C = x/hypot;
            S = y/hypot;
        }
        else {

            C = this.xx;
            S = this.yx;
            
            hypot = Math.hypot(C,S);
            C /= hypot;
            S /= hypot;
        }

        let R = new HomoRot(
            C,  S,  0,
           -S,  C,  0,
            0,  0,  1
        );

        let T = new HomoRot().globalToLocal_(new HomoVec(-this.zx, -this.zy, this.zz));

        return [R, T];
    }

    this.normalize = function(){

        let rt = this.rtDecomp();
        return rt[0].dotRot(rt[1]);
    }

    this.inverse = function(){

        let rt = this.rtDecomp();
        
        rt[0].xy = -rt[0].xy;
        rt[0].yx = -rt[0].yx;
        
        rt[1].zx = -rt[1].zx;
        rt[1].zy = -rt[1].zy;
        rt[1].xz = -rt[1].xz;
        rt[1].yz = -rt[1].yz;

        return rt[1].dotRot(rt[0]);
    }
}

// to get a right pentagon in beltrami-klein:
// -> draw a five-pointed star centered at origin
// -> 1/A distance from center to point -- first point at (1/A, 0)
// -> coordinate of star 72 degrees from that is (A, B/A) so that:
// - -> (A + Bi/A)^5 = 1
// - -> (A^2 + Bi)^5 = 1
// -> find the fifth route so that (a+Bi)^5 -> 5
// -> A = sqrt(a)
// you now have a distance, A, by which to travel in Euclidean
// project (A,0) into Beltrami-Klein to get point C
// project (-A,0) into Beltrami-Klein to get point D
// find global-to-local matrix of D -> 0toD
// pass C thru 0_D to get C_D
// ### C_D is the point you want
// rotate it around 

// to correct a matrix M
// xz and yz will have rotation information; zx and zy won't
// get the equation for the cosine and sine of your rotation information
// find an inverted rotation matrix, R
// R^-1 * M is T -- the translation matrix -- xz and yz of this thing should be zx and zy, respectively
// recalculate the translation matrix
// rotate this translation matrix (preferrably with scaled rotation)
