//adding additional comments to fully explain this sample (also a simpler sample is here: http://jsfiddle.net/rniemeyer/BaXtE/)
/*
This is the definition for an extended observable called a "protectedObservable"
-this would generally belong in a separate library
-the idea is that you can still use it just like any observable, but it has more features
-some of the extra features that it provides
  -when someone writes to it, the value is cached until you call its "commit" method
  -a "reset" method will update the bound fields back to the original value
  -the temporary value is exposed, in case you need to send it to the server
  -a dirtyFlag is exposed using a dependentObservable that checks the original vs. temp value
-now you can bind to your observable and any of its sub-observables (temp, isDirty, commit, reset)
-this post explains this idea in more detail: http://www.knockmeout.net/2011/03/guard-your-model-accept-or-cancel-edits.html  
*/
ko.protectedObservable = function (initalValue) {
    //private variables
    var _temp = ko.observable(initalValue),
        _actual = ko.observable(initalValue);
    //what we actually return is a writeable dependentObservable, so we can intercept writes to it
    var result = ko.dependentObservable({
        read: function () {
            return _actual();
        },
        write: function (newValue) {
            _temp(newValue);
        }
    });
    //expose the temporary value
    result.temp = _temp;
    //expose a flag to indicate that the values are different
    result.isDirty = ko.dependentObservable(function () {
        return _temp() !== _actual();
    });
    //commit the temporary value to our observable
    result.commit = function () {
        _actual(_temp());
    };
    //notify subscribers to update their value with the original
    result.reset = function () {
        _actual.valueHasMutated();
        _temp(_actual());
    };
    return result;
};
//This is a simple custom binding that will fade in or out an element based on the truthiness of the value passed to it.
//This would likely belong in a separate library
ko.bindingHandlers.showVisible = {
    update: function (element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());
        if (value) {
            $(element).show(500);
        } else {
            $(element).hide();
        }
    }
};
// http://www.knockmeout.net/2011/05/dragging-dropping-and-sorting-with.html
// http://jsfiddle.net/rniemeyer/sBHaP/
//connect items with observableArrays
ko.bindingHandlers.sortableList = {
    init: function (element, valueAccessor, allBindingsAccessor, data, context) {
        var options = ko.utils.unwrapObservable(valueAccessor());
        $(element).data("sortList", options.list || valueAccessor()); //attach meta-data
        $(element).sortable({
            update: function (event, ui) {
                var item = ui.item.data("sortItem");
                if (item) {
                    //identify parents
                    var originalParent = ui.item.data("parentList");
                    var newParent = ui.item.parent().data("sortList");
                    //figure out its new position
                    var position = ko.utils.arrayIndexOf(ui.item.parent().children(), ui.item[0]);
                    if (position >= 0) {
                        originalParent.remove(item);
                        newParent.splice(position, 0, item);
                    }
                   ui.item.remove();
                }
            },
            connectWith: '.container'
        });
        return ko.bindingHandlers.template.init.apply(this, arguments);
    },
    update: function (element, valueAccessor, allBindingsAccessor, data, context) {
        var options = ko.utils.unwrapObservable(valueAccessor()),
            newOptions = {};
        //build our options to pass to the template engine
        if (options.list) {
            newOptions.foreach = options.list;
            newOptions.name = options.tmpl;
            newOptions.includeDestroyed = options.includeDestroyed;
            newOptions.afterAdd = options.afterAdd;
            newOptions.beforeRemove = options.beforeRemove;
        } else {
            newOptions.foreach = valueAccessor();
        }
        //use an afterRender function to add meta-data
        if (options.afterRender) {
            //wrap the existing function, if it was passed
            newOptions.afterRender = function (element, data) {
                ko.bindingHandlers.sortableList.afterRender.call(data, element, data);
                options.afterRender.call(data, element, data);
            };
        } else {
            newOptions.afterRender = ko.bindingHandlers.sortableList.afterRender;
        }
        //call the actual template binding
        ko.bindingHandlers.template.update(element, function () {
            return newOptions;
        }, allBindingsAccessor, data, context);
    },
    afterRender: function (elements, data) {
        ko.utils.arrayForEach(elements, function (element) {
            if (element.nodeType === 1) {
                $(element).data("sortItem", data);
                $(element).data("parentList", $(element).parent().data("sortList"));
            }
        });
    }
};
//control visibility, give element focus, and select the contents (in order)
ko.bindingHandlers.visibleAndSelect = {
    update: function (element, valueAccessor) {
        ko.bindingHandlers.visible.update(element, valueAccessor);
        if (valueAccessor()) {
            setTimeout(function () {
                $(element).focus().select();
            }, 0); //new tasks are not in DOM yet
        }
    }
};
//http://jsfiddle.net/rniemeyer/NAgNV/
ko.bindingHandlers.datepicker = {
    init: function(element, valueAccessor, allBindingsAccessor) {
        //initialize datepicker with some optional options
        var options = allBindingsAccessor().datepickerOptions || {};
        $(element).datepicker(options);

        //handle the field changing
        ko.utils.registerEventHandler(element, "change", function() {
            var observable = valueAccessor();
            observable($(element).datepicker("getDate"));
        });

        //handle disposal (if KO removes by the template binding)
        ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
            $(element).datepicker("destroy");
        });

    },
    update: function(element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor()),
            current = $(element).datepicker("getDate");
        
        if (value - current !== 0) {
            $(element).datepicker("setDate", value);   
        }
    }
};

