$(function () {
    $('#slosilo-search').typeahead({
      source: function (q, callback) {
				$.getJSON('/typeahead',{q:q},function(data){
					callback(data);
				});
			}
    });
});
