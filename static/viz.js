class AppContext {
    constructor() {	
	// GET JSON AND UPDATE NODES
	$.ajax({
	    url : $SCRIPT_ROOT + '/_update_data',
	    dataType : 'json',
	    context : this,
	    complete : function (d) {
		this.data = d;
		this.viz = new TreeViz(this.data.responseJSON,
				       this);} 
	});
    }

    // OVERLAY FUNCTIONS
    overlay(c) {
	console.log(this.viz);
	let viz = this.viz;
	let context = this;
	$( '.overlay' )
	    .css( "width", "100%" );

	$( '#title' )
	    .off()
	    .val(c.data.title)
	    .change(function() {
		c.data.title = $(this).val();
		viz.reDraw();
		context.sendData();
	    });
    
	$( '#text' )
	    .off()
	    .val(c.data.text)
	    .on('change',function() {
		c.data.text = $(this).val();
		viz.reDraw();
		context.sendData();
	    })
	$( '#add_child' )
	    .off()
	    .on('click', function() {
		
		context.addNode(c);
	    })
	$( '#erase' )
	    .off()
	    .on('click', function() {
		context.removeNode(c);
	    })
	   	    
    }

    addNode(treeNode) {
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
    
	// add the data into the tree
	treeNode.data.children.push(empty);

	// create hierarchy
	empty = d3.hierarchy(empty);
	empty.depth = treeNode.depth + 1;
	empty.parent = treeNode;

	treeNode.children.push(empty);

	// redraw animation and send to server
	this.viz.reDraw();
	this.sendData();
    }

    removeNode(treeNode) {
	if (treeNode.children == undefined) {
	    // grab parent
	    let parent = treeNode.parent;
	    
	    // figure out what my current index is
	    let index = $.inArray(treeNode, parent.children);
	    
	    // remove from the hierarchy
	    parent.children.splice(index, 1);
	    
	    // remove from the data structure
	    parent.data.children.splice(index, 1);

	    // redraw animation and send to server
	    this.viz.reDraw();
	    this.sendData();
	}
    }

    // function to send json data to server for update
    sendData() {
	$.post($SCRIPT_ROOT + '/_update_data',
	       // only sending the data portion of the tree
	       // back to the server
	       JSON.stringify(this.viz.tree.data),
	       function(d, textStatus) {
		   console.log(textStatus)
	       },
	       "json");
    }

    
}

class TreeViz {

    constructor(data, appContext) {

	let viz = this;

	this.ac = appContext
	
	this.tree = d3.hierarchy(data);

	// DEFINE SVG PARAMETERS
	this.svg = d3.select("svg"),
	this.width = +this.svg.attr("width"),
	this.height = +this.svg.attr("height");

	// DO WE NEED TO MESS WITH THE COLOR?
	this.color = d3.scaleOrdinal(d3.schemeCategory20);

	// DEFINE LINK PARAMENTES
	this.svg.append("g").attr("class", "links");   

	// DEFINE NODE PARAMETERS
	this.svg.append("g").attr("class", "nodes");

 	// DEFINE SIMULATION PARAMETERS
	this.simulation = d3.forceSimulation()
	    .force("link", d3.forceLink()
		   .id(function(d) { return d.id; })
		   .distance(50))
	    .force("charge", d3.forceManyBody()
		   .strength(-120))
	    .force("center", d3.forceCenter(this.width / 2, this.height / 2))
	    .on("tick", function () {
		viz.ticked();
	    })
	
	this.reDraw();

    }
    // function called to update data bindings and
    // simulation entities
    reDraw() {
	let viz = this;
	let nodes = viz.tree.descendants();
	let links = viz.tree.links();
    
	let link = viz.svg.select(".links")
	    .selectAll(".link")
	    .data(links);

	let node = viz.svg.select(".nodes")
	    .selectAll(".node")
	    .data(nodes);

	// ENTER --------------------------------
	let nodeEnter = node.enter().append("g")
	    .attr('class', 'node');
	nodeEnter.append("circle")
	    .attr("r", 15)
	    .attr("fill", function(d) { return "yellow"; })
	    .call(d3.drag()
		  .on("start", function(d) {
		      viz.dragstarted(d);})
		  .on("drag", function(d)
		      {viz.dragged(d);})
		  .on("end", function(d) {
		      viz.dragended(d);}));
	nodeEnter.append("text")
	    .attr('class', 'label')
	    .attr("text-anchor", "middle")
	nodeEnter.on('click', function(d) {
	    d3.event.stopPropagation();
	    viz.ac.overlay(d);
	})

	let linkEnter = link.enter().append("line")
	    .attr('class', 'link');


	// UPDATE -------------------
	var nodeUPDATE = this.svg.select(".nodes")
	    .selectAll('.node')
	    .select('text')
	    .text( function (d) {
		return d.data.title});

	var linkUPDATE = this.svg.select(".links")
	    .selectAll('.link')
	    .attr("stroke-width",
		  function(d) {
		      return 5;
		  })

	// EXIT --------------
	node.exit().remove();
	link.exit().remove();

	// tell the simulation about updated nodes and links
	this.simulation.nodes(nodes);
	this.simulation.force("link")
	    .links(links);

	// initialize simulation forces to updated nodes and links
	this.simulation.force("center")
	    .initialize(nodes);
	this.simulation.force("charge")
	    .initialize(nodes);
    }

    // SIMULATION FUNCTIONS -------------
    ticked() {
	let eachlink = this.svg.selectAll('.link');
	eachlink
	    .attr("x1", function(d) { return d.source.x; })
	    .attr("y1", function(d) { return d.source.y; })
	    .attr("x2", function(d) { return d.target.x; })
	    .attr("y2", function(d) { return d.target.y; });
	let eachnode = this.svg.selectAll('.node');
	eachnode
	    .attr("transform", function(d) {
		return 'translate(' + [d.x, d.y] + ')';});
    }

    dragstarted(d) {
	if (!d3.event.active) {
	    this.simulation.alphaTarget(0.3).restart();
	}
	d.fx = d.x;
	d.fy = d.y;
    }

    dragged(d) {
	d.fx = d3.event.x;
	d.fy = d3.event.y;
    }

    dragended(d) {
	if (!d3.event.active) {
	    this.simulation.alphaTarget(0);
	}
	d.fx = null;
	d.fy = null;
    }
}

// DOCUMENT READY SCRIPTS
$(document).ready( function(result) {

    ac = new AppContext()
   
})
