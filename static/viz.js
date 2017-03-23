var tree
var svg
var color
var simulation
var tree

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
	tree = d3.hierarchy(d);

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
	    .attr("class", "links");   

	// DEFINE NODE PARAMETERS
	nodes = svg.append("g")
	    .attr("class", "nodes");

 	// DEFINE SIMULATION PARAMETERS
	simulation = d3.forceSimulation()
	    .force("link", d3.forceLink()
		   .id(function(d) { return d.id; })
		   .distance(100))
	    .force("charge", d3.forceManyBody())
	    .force("center", d3.forceCenter(width / 2, height / 2))
	    .on("tick", ticked);
	
	update_data(tree);
    })
})

// OVERLAY FUNCTIONS
function open_overlay(c) {
    console.log(c);
    $( '.overlay' )
	.css( "width", "33%" );

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
    console.log(tree)
    console.log(tree.links())
    
    var link = svg.select(".links")
	.selectAll(".link")
	.data(links);

    var node = svg.select(".nodes")
	.selectAll(".node")
	.data(nodes);

    // enter does something different

    console.log('starting enter')
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
	.attr('transform', 'translate(10,-50)')
	.on("click", function(d) {
	    d3.event.stopPropagation();
	    console.log('clicked');
	    add_node(d);
	});
    
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


    console.log('starting update')
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
    console.log(nodes)
    console.log(links)
    node.exit().remove()
    link.exit().remove()

    console.log('aou')
    simulation.nodes(nodes);
    console.log('aoeuaoeu')
    simulation.force("link")
	.links(links);
    console.log('aa')
    simulation.restart()
   
}

function add_node(treeNode) {
    var empty = { "id" : "new",
		  "text" : "",
		  "title" : "New Node"}
    empty = d3.hierarchy(empty);
    empty.vx = 0;
    empty.vy = 0;
    empty.x = 200;
    empty.y = 200;
    index = 0;
    treeNode.descendants().forEach(function(node) {
	if (node.index > index) {
	    index = node.index;
	}
    })
    empty.index = index + 1;
    console.log(empty);
    treeNode.children.push(empty);
    update_data();
}




	
