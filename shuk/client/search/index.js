Meteor.startup(function(){
  Template.search.events({
    'focusin input.nextsong':function(e){
      addInputEvent();
    },
    'focusout input.nextsong':function(e){
      removeInputEvent();
    },  
    'keydown input.nextsong':function(e){
      if(jQuery.inArray(e.which, CONTROL_KEYCODES)!=-1){
        autocompleter = $('#autocompleter li');
        old = currentSelected;
        
        if(currentSelected==autocompleter.length-1 && e.which == 40){
          currentSelected = 0;
        }else if(!currentSelected && e.which == 38){
          currentSelected = autocompleter.length-1;
        }else{
          if(e.which == 40)
            currentSelected++;
          else if(e.which ==38)
            currentSelected--;
        }
        if(old!=-1) $('#autocompleter li').eq(old).removeClass('selected')
        $('#autocompleter li').eq(currentSelected).addClass('selected')
      }
      if(e.which==ENTER){
        if(currentSelected==autocompleter.length-1){
          autocomple_offset +=AUTOCOMPLETE_PAGE_SIZE;
          search(document.getElementById('nextsong').value, AUTOCOMPLETE_PAGE_SIZE);        
          currentSelected = -1;
          $('#autocompleter li.selected span').html('Loading...');
        }    
        
        var $this = $('#autocompleter li').eq(currentSelected);
        var vid = get_youtube_id($this.children('a').attr("href"));
        var title = $this.children('a').attr("title");      
           
        if(currentSelected!==-1){
          videos.add({vid:vid, title:title});
          $("#autocompleter").hide();            
        }
      }
      if(e.which==ESC){
        currentSelected = -1;
        autocomple_offset = 1;
        $("#autocompleter").hide();    
      }
    }  
  });
});