var tree
var svg
var color
var simulation
var tree
var force
var adding = 0;
var width
var height

function clean(treeNode){
    return treeNode.data;
}
    

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
	console.log(d);
	tree = d3.hierarchy(d);
	console.log(tree);

	// DEFINE SVG PARAMETERS
	svg = d3.select("svg"),
	width = +svg.attr("width"),
	height = +svg.attr("height");

	svg.on('click',  function() {
	    d3.selectAll('.context_menu')
		.attr('visibility', 'hidden');
	    //d3.selectAll('.overlay')
	//	.style('width', '0%');
	})
	color = d3.scaleOrdinal(d3.schemeCategory20);

	// DEFINE LINK PARAMENTES
	links = svg.append("g")
	    .attr("class", "links");   

	// DEFINE NODE PARAMETERS
	nodes = svg.append("g")
	    .attr("class", "nodes");

 	// DEFINE SIMULATION PARAMETERS

	simulation = d3.forceSimulation()
	    .force("link", d3.forceLink()
		   .id(function(d) { return d.id; })
		   .distance(50))
	    .force("charge", d3.forceManyBody()
		   .strength(-120))
	    .force("center", d3.forceCenter(width / 2, height / 2))
	    .on("tick", ticked);
	
	update_data(tree);
    })
})

// OVERLAY FUNCTIONS
function open_overlay(c) {
    console.log(c);
    $( '.overlay' )
	.css( "width", "100%" );

    $( '#title' )
	.off()
	.val(c.data.title)
	.change(function() {
	    c.data.title = $(this).val();
	    update_data();
	    send_data();
	});
    
    $( '#text' )
	.off()
	.val(c.data.text)
	.on('change',function() {
	    c.data.text = $(this).val();
	    update_data();
	    send_data();
	})
    $( '#add_child' )
	.off()
	.on('click', function() {
	    add_node(c);
	})
    $( '#erase' )
	.off()
	.on('click', function() {
	    remove_node(c);
	})
	    
	    
}

function send_data() {
    $.post($SCRIPT_ROOT + '/_update_data',
	   JSON.stringify(clean(tree)),
	   function(d, textStatus) {
	       console.log(textStatus)
	   },
	   "json");
}


function update_data() {
   
    // UPDATE ---------------------------------
    var nodes = tree.descendants();
    var links = tree.links();
    
    var link = svg.select(".links")
	.selectAll(".link")
	.data(links);

    var node = svg.select(".nodes")
	.selectAll(".node")
	.data(nodes);

    // enter does something different

    
    // ENTER --------------------------------
    var nodeEnter = node.enter().append("g")
	.attr('class', 'node');
    nodeEnter.append("circle")
	.attr("r", 15)
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

      
    // links
    var linkEnter = link.enter().append("line")
	    .attr('class', 'link');


    // UPDATE
    var nodeUPDATE = svg.select(".nodes")
	.selectAll('.node')
	.select('text')
	.text( function (d) {
	    return d.data.title});

    var linkUPDATE = svg.select(".links")
	.selectAll('.link')
	.attr("stroke-width",
	      function(d) {
		  //return Math.sqrt(d.value);
		  return 5;
	      })

    // EXIT
    node.exit().remove();
    link.exit().remove();
    simulation.nodes(nodes);
    simulation.force("link")
	.links(links);

    simulation.force("center")
	.initialize(nodes);
    simulation.force("charge")
	.initialize(nodes);
	
   
}

function add_node(treeNode) {
    // make sure that this treeNode has a place
    // to put children
    if (treeNode.data.children == undefined){
	treeNode.data.children = [];
	treeNode.children = [];
    }

    // create empty node with default info
    var empty = { "id" : "new",
		  "text" : "",
		  "title" : "New Node",
		  "parent" : treeNode.data.id}
    console.log(empty)
    console.log('empty')
    
    // add the data into the tree
    treeNode.data.children.push(empty);

    // create hierarchy
    empty = d3.hierarchy(empty);
    empty.depth = treeNode.depth + 1;
    empty.parent = treeNode;
    //empty.x = width/2
    //empty.y = height/2

    treeNode.children.push(empty);

    // redraw animation
    update_data();

    // send data to the server
    send_data();
}

var remove_node = function(treeNode) {
    console.log(treeNode.children)
    if (treeNode.children == undefined) {
	let parent = treeNode.parent
	// figure out what my current index is
	let index = $.inArray(treeNode, parent.children)
	// remove from the hierarchy
	parent.children.splice(index, 1);
	// remove from the data structure
	parent.data.children.splice(index, 1);
	update_data();

	// send data to server
	send_data();
    }   
}

			     

    
    




	
