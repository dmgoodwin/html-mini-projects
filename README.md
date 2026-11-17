# html-mini-projects
 HTML Mini Projects

This repository contains some (not all) of the HTML projects I made on my spare time over the years. I may add to this repository as I get bored and make more projects.

On account of the fact that an AI-generated project probably wouldn't leave commented code in its repository, I will not bother removing the lines which I commented out.

The projects currently in here, as well as a brief description of each, are as follows:

- `delaunaytriangulation` - A visualization of the implementation of the Guibas-Stolfi code which I used when I still practiced competitive programming. Click on the webpage's canvas multiple times and press "Generate" to watch the delaunay triangulation construction.
- `hyperbolic` - A visualization of an order-4 pentagonal tiling (https://en.wikipedia.org/wiki/Order-4_pentagonal_tiling). The underlying maths in this visualization use 2d-projective geometry, hence the prevalence of "homo" as a prefix in the code (it's short for "homogeneous"). Use WASD to traverse the tiling; use 'F' to switch between Beltrami-Klein and Poincare projections. Use 'R' to show indexing/tiling information (which can be used to uniquely identify a tile -- see also: `conditions.jpg` and `hyperbolic-index-math.png`)
- `pixelTree` - A visualization of how 2D-trees can be used to reduce the space complexity required to represent 2d data, where said 2d data is either "on" or "off". Scroll to change the "brush size". Left-click and drag the mouse to place or remove black spaces; positive brush size adds black spaces, negative brush size removes black spaces. Press A to toggle visibility of the divisions of the 2d tree.
- `scales` - A proof-of-concept for a game idea I had at one point. 100 dots appear on a screen in no particular formation, which the user must click on. Clicking any dot more than once means that the user "loses" and is shown which dots they did and didn't click. If that doesn't happen by the time each dot is clicked, the user "wins".

I intend to eventually make a website which hosts each one of these pages.


