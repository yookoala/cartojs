/**
 * CartJs
 *
 */

var Carto;
Carto = Carto || {};

(function (pub, $, Backbone) {

    // model to store search criterias
    var Sel = Backbone.Model.extend({
        defaults: {
            "district": 0,
            "type": ""
        }
    });

    // model for single content node
    // that is loaded from API call
    var Node = Backbone.Model.extend({
    });

    // collection of content nodes
    var Nodes = Backbone.Collection.extend({
        model: Node,
        focus: false,
        initialize: function (values, options) {
            var coll = this;

            // default options
            options = _.extend({}, {
                // a function to filter model according to selection
                'selFilter': function (coll, model) {
                    console.log("fallback selFilter");
                    return false;
                }
            }, options);
            coll.selFilter = options.selFilter;

            coll.sel.bind('change', function () {
                console.log('Selection changed');
            });
        },
        setFocus: function (pid, lid) {
            var coll = this;
            coll.trigger('focus', pid, lid);
        },
        unsetFocus: function () {
            var coll = this;
            coll.trigger('unfocus');
            coll.focus = false;
        },
        sel: new Sel(),
        selected: function () {
            // return the filtered results
            // of the collection
            var filtered = [];
            var coll = this;
            return coll.filter(function (model) {
                return coll.selFilter(coll, model);
            });
        }
    });

    // view for map
    var MapView = Backbone.View.extend({
        initialize: function (options) {
            var view = this;

            // collection of nodes
            view.nodes = options.nodes;

            // Google map object
            view.map = options.map;

            // function to generate marker(s) form node
            // and add to the view
            view.addMarker = options.addMarker || function (view, node){};

            view.markers = [];
            view.nodes.bind('refreshed', function () {
                console.log('MapView: nodes refreshed');
                view.render();
            });
        },
        render: function () {
            var view = this;
            view.clearMarkers();
            view.renderMarkers(view.nodes);
        },
        smoothZoom: function (target, finished, now) {
            var view = this;
            if (typeof now == "undefined") {
                now = view.map.getZoom();
            }

            if (target == now) {
                finished && finished();
                return
            } else if (target > now) {
                now++;
            } else {
                now--;
            }

            var s = google.maps.event.addListener(view.map, "zoom_changed", function () {
                google.maps.event.removeListener(s);
                view.smoothZoom(target, finished, now)
            });
            setTimeout(function () {
                view.map.setZoom(now);
            }, 200)
        },
        clearMarkers: function () {
            var view = this;
            console.log("clearMarkers")
            for (i in view.markers) {
                if (typeof view.markers[i].setMap != "undefined") {
                    view.markers[i].setMap(null);
                }
            }
            view.markers = []; // clear array
        },
        renderMarkers: function (nodes) {
            var view = this;
            var nodes = view.nodes.selected();
            console.log("renderMarkers")
            _.each(nodes, function (node) {
                view.addMarker(view, node);
            });
        }
    });

    // view for sidebar
    var ListView = Backbone.View.extend({
        tagName: 'div',
        initialize: function (options) {
            var view = this;

            // collection of nodes
            view.nodes = options.nodes;

            // can render the list with template name and variable
            view.renderWith = options.renderWith || function(name, vars) {};

            // runs after rendering the view
            // can be used to bind links listener
            view.postRender = options.postRender || function() {};

            view.nodes.bind('refreshed', function () {
                console.log('ListView: nodes refreshed');
                view.render();
            });
        },
        render: function () {
            var view = this;
            var nodes = view.nodes.selected();
            view.$el.empty();
            _.each(nodes, function (model, i) {
                view.$el.append(
                    view.renderWith('list-view-item', {
                        "model": model
                    })
                );
            });
            view.postRender(view);
        },
        appendTo: function (wrapper) {
            var view = this;
            $(wrapper).empty().append(view.el);
        }
    });

    // expose to public
    // (also keep the above code simple to read)
    pub.Sel = Sel
    pub.Node = Node
    pub.Nodes = Nodes
    pub.MapView = MapView
    pub.ListView = ListView

})(Carto, jQuery, Backbone);
