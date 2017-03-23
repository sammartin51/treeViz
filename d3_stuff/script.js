var data = [
    { x: 400, y: 200, text: 'sam' },
    { x: 150, y: 150, text: 'amanda' },
    { x: 300, y: 1000, text: 'aoeu'},
    { x: 0, y: 0, text: 'dog'}
];

// lets try to add some text over
d3.select("body")
    .style("background-color", 'white');

// select svg
var svg = d3.select('svg')






function scatter(data, svg) {

    // declare sizing variables
    var margin = {top: 20, right: 0, bottom:20, left:30},
	width = +svg.attr("width") - margin.left - margin.right,
	height = +svg.attr("height") - margin.top - margin.bottom;

    // create axis group
    var g = svg.append('g')
	.attr('transform',
	      'translate(' + margin.left + ',' + margin.bottom + ')');

    var radius = 20
    
    // create scale functions
    var x = d3.scaleLinear()
	.domain([0, d3.max(data, function(d) { return d.x + radius; })])
	.range([0, width]);
    // reverse range variables to flip x axis to zero down
    var y = d3.scaleLinear()
	.domain([0, d3.max(data, function(d) { return d.y + radius; })])
	.range([height, 0]);

    // define the axes
    var xAxis = d3.axisBottom()
	.scale(x);
    
    var yAxis = d3.axisLeft()
	.scale(y);

    var node = g.selectAll('g')
	.data(data)
	.enter().append('g')
	.attr("transform", function (d, i)
	      {return "translate(" + x(d.x) + "," + y(d.y) + ")";});

    node.append("circle")
	.attr("r", radius)
	.attr("fill", "black")
	.attr("stroke", "gray")
	.on('mouseover', function(){
	    d3.select(this)
		.transition()
		.duration(1000)
		.style('fill', 'red');
	    tooltip.transition()
		.duration(200)
		.style("opacity", 0.9);
	    tooltip.html('aoeuaoeu')
		.style("left", (d3.event.pageX) + "px")
		.style("top", (d3.event.pageY) + "px");
	})
	.on('mouseout', function(){
	    d3.select(this)
		.transition()
		.duration(1000)
		.style('fill', 'black')
	});

    node.append("text")
	.text(function (d, i){ return d.text;})
	.style("font-family", "sans-serif")
	.style("fill", "red")
	.style("text-anchor", "middle")
	.style("visibility", "visible")
	.style("pointer-events", "none");

    g.append("g")
	.attr("class", "x axis")
    	.attr("transform",
	      "translate(0," + height + ")")
	.call(xAxis);

    g.append("g")
	.attr("class", "y axis")
	.call(yAxis);
}

scatter(data, svg);

