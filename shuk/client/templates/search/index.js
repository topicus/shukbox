Meteor.startup(function(){
  /*
  Modificar para que toda la logica que esta aca pase al widget
  una opcion es mapear los keycodes contra funciones del widget
  */
  var did_scroll = false;
  Template.search.rendered = function(){
    console.log("RENDER");
    $(window).scroll(function() {
      if($(document).scrollTop() + $(window).height() >= $(document).height()-500) {
        did_scroll = true;
        
      }
    }); 
    setInterval(function() {
        if ( did_scroll ) {
          searchWidget.nextPage(function(){
            did_scroll = false;
          });
        }
    }, 600);    
    $('#nextsong').typeahead({
      source: function (query, typeahead) {
          var ty = this;
          $.getJSON("http://suggestqueries.google.com/complete/search?callback=?",
              { 
                "hl":"es", // Language
                "ds":"yt", // Restrict lookup to youtube
                "jsonp":"suggestCallBack", // jsonp callback function name
                "q":query, // query term
                "client":"youtube" // force youtube style response, i.e. jsonp
              }
          );
          suggestCallBack = function (data) {
              var suggestions = [];
              suggestions.push(query);
              $.each(data[1], function(key, val) {
                  suggestions.push(String(val[0]));
              });
              suggestions.length = 6; // prune suggestions list to only 5 items
              return ty.process(suggestions);
          };                  
      },
      updater:function (query) {
        log("UPDATER");
        searchWidget.clear();
        searchWidget.search(query);
        return query;
      }              
  });    
  };
  Template.search.events({
    'keydown #nextsong':function(e){ 
      if(e.keyCode == 13){
        searchWidget.clear();
        searchWidget.search($('#nextsong').val());
      }
    }
  });
});