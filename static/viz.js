var data
var svg
var links
var nodes
var color
var simulation

// SIMULATION FUNCTIONS
function ticked() {
    var eachlink = svg.selectAll('.link');
    eachlink
	.attr("x1", function(d) { return d.source.x; })
	.attr("y1", function(d) { return d.source.y; })
	.attr("x2", function(d) { return d.target.x; })
	.attr("y2", function(d) { return d.target.y; });
    var eachnode = svg.selectAll('.node');
    eachnode
	.attr("transform", function(d) {
	    return 'translate(' + [d.x, d.y] + ')';});
};

function dragstarted(d) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
}

function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
}

function dragended(d) {
    if (!d3.event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
}

// DOCUMENT READY SCRIPTS
$(document).ready( function(result) {
    
    // GET JSON AND UPDATE NODES
    $.getJSON($SCRIPT_ROOT + '/_update_data', function(d) {
	console.log(d)
	data = d;
	temp = [];
	data.nodes.forEach( function(node) {
	    node.children.forEach( function(child) {
		temp.push({"source" : node,
			   "target" : child});
		console.log(child);
	    })
	})
	console.log(temp);
	console.log(data);

	// DEFINE SVG PARAMETERS
	svg = d3.select("svg"),
	width = +svg.attr("width"),
	height = +svg.attr("height");

	svg.on('click',  function() {
	    d3.selectAll('.context_menu')
		.attr('visibility', 'hidden');
	    d3.selectAll('.overlay')
		.style('width', '0%');
	})

	color = d3.scaleOrdinal(d3.schemeCategory20);

	// DEFINE LINK PARAMENTES
	links = svg.append("g")
	    .attr("class", "links")   

	// DEFINE NODE PARAMETERS
	nodes = svg.append("g")
	    .attr("class", "nodes")

	// DEFINE SIMULATION PARAMETERS
	simulation = d3.forceSimulation()
	    .force("link", d3.forceLink()
		   .id(function(d) { return d.id; })
		   .distance(100))
	    .force("charge", d3.forceManyBody())
	    .force("center", d3.forceCenter(width / 2, height / 2))
	    .on("tick", ticked);;
  
	update_data(data);
    })
})

// OVERLAY FUNCTIONS
function open_overlay(c) {
    console.log('opening overlay')    
    $( '.overlay' )
	.css( "width", "33%" );

    $( '#title' )
	.off()
	.val(c.title)
	.change(function() {
	    c.title = $(this).val();
	    update_data();
	    send_data();
	});
    
    $( '#text' )
	.off()
	.val(c.text)
	.on('change',function() {
	    c.text = $(this).val();
	    update_data();
	    send_data();
	})
}

function send_data() {
    console.log(data)
    $.post($SCRIPT_ROOT + '/_update_data',
	   JSON.stringify(data),
	   function(d, textStatus) {
	       console.log(textStatus)
	   },
	   "json");
}


function update_data() {
    // UPDATE ---------------------------------

    
    var link = links.selectAll(".link")
	.data(data.links);

    var node = nodes.selectAll(".node")
	.data(data.nodes);

    // enter does something different

    // ENTER --------------------------------
    // nodes
    var nodeEnter = node.enter().append("g")
	.attr('class', 'node');
    nodeEnter.append("circle")
	.attr("r", 20)
	.attr("fill", function(d) { return color(d.group); })
	.call(d3.drag()
	      .on("start", dragstarted)
	      .on("drag", dragged)
	      .on("end", dragended));
    nodeEnter.append("text")
	.attr('class', 'label')
	.attr("text-anchor", "middle")
    nodeEnter.on('click', function(d) {
	d3.event.stopPropagation();
	open_overlay(d); } );
    nodeEnter.on('contextmenu', function() {
	d3.event.preventDefault();
	d3.select(this)
	    .select('.context_menu')
	    .attr('visibility','visible');
    })
    var context_menus = nodeEnter.append('g')
	.attr('class', 'context_menu')
	.attr('visibility','hidden')
	.append('g').attr('class', 'menu-entry')
	.attr('transform', 'translate(10,-50)');
    
    context_menus.append('rect')
	.attr('width', 75)
	.attr('height', 20)
	.style('fill', 'rgb(244,244,128)');

    context_menus.append('text')
	.text('Add Child')
	.attr('y', '15');
    // links
    var linkEnter = link.enter().append("line")
	    .attr('class', 'link');


    // UPDATE
    var nodeUPDATE = nodes.selectAll('.node')
	.select('text')
	.text( function (d) {
	    return d.title});

    var linkUPDATE = links.selectAll('.link')
	.attr("stroke-width",
	      function(d) {
		  //return Math.sqrt(d.value);
		  return 5;
	      })

    // EXIT
	
    node.exit().remove()
    link.exit().remove()

    simulation.nodes(data.nodes);

    simulation.force("link")
	.links(data.links);

    simulation.restart()

    // EXIT
    nodes.exit().remove()
    links.exit().remove()   
}





	
