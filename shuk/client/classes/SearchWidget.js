(function(window){
	function SearchWidget(songcollection){	
		var that = this;
		var last_query;
		this.collection = songcollection; 
		this.get_youtube_id = function(url){
		    var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
		    var match = url.match(regExp);
		    if (match&&match[7].length==11){
		        return match[7];
		    }
		    return false;
		};
		this.parseFeed = function(data){
			var self = this;
			var feed = data.feed;
			var entries = feed.entry || [];
			var html = ['<ul id="autocompleter">'];
			_.each(entries,function(entry){
        var playCount = (typeof entry.yt$statistics !== 'undefined')? entry.yt$statistics.viewCount.valueOf() + ' views' : "";
        var title = entry.title.$t;
        var thumb = entry.media$group.media$thumbnail[3].url;
        var thumb_height = entry.media$group.media$thumbnail[3].height * 0.5;
        var thumb_width = entry.media$group.media$thumbnail[3].width * 0.5;	
      	var thumb_tag = '<div style="height:'+thumb_height+'px; width:'+thumb_width+'px" class="thumb-search"><img src="'+thumb+'"/></div>'
        var lnk = '<a data-thumb="'+thumb+'" title="'+entry.title.$t+'" href = \"' + entry.link[0].href + '\"></a>';
        html.push('<li>', thumb_tag, title, ', ', playCount, ', ', lnk, '</li>');		        			
			});	
	    html.push('</ul>');
	    $('#results').append(html.join(''));
	    var autocompleter = $('#autocompleter li');
	    autocompleter.click(function(e){
        var $video = $(this);
        var vid = that.get_youtube_id($video.children('a').attr("href"));
        var title = $video.children('a').attr("title");   
        var newvideo = new Topicus.Song({code:vid,title:title,position:self.collection.length});         
        newvideo.save();
	    });				
		};
		this.nextPage = function(callback){
      that.autocomple_offset +=that.AUTOCOMPLETE_PAGE_SIZE;
      that.search(last_query, function(error,response){
      	callback(error, response);
      });        
		};
		this.clear = function(){
			$('#results').empty();
		};
		this.search = function(q,callback){
			if(q!==''){
				last_query = q;
				var offset = (typeof(that.autocomple_offset) !== 'undefined')? that.autocomple_offset : 1;
				var url = 'http://gdata.youtube.com/feeds/' + 
		              'videos?vq='+q+'&max-results='+that.AUTOCOMPLETE_PAGE_SIZE+'&' + 
		              'alt=json-in-script&' +
		              'start-index='+offset+'&' +
		              'orderby=relevance&sortorder=descending&format=5&fmt=18'
				$.ajax({
					type: 'GET',
					url: url,
					async: false,
					contentType: "application/json",
					dataType: 'jsonp',
					success: function(response) {
						that.parseFeed(response);
						if(typeof callback === 'function')
							callback(null,response);
					},
					error: function(e){
						if(typeof callback === 'function')
							callback(e,null);
					  alert(e.message);
					}
				});
			}else{
				document.getElementById("autocompleter").style.display = 'none';
			}		
		};

	};

	SearchWidget.prototype.CONTROL_KEYCODES = new Array(40,38,37,39)
	SearchWidget.prototype.ENTER = 13;
	SearchWidget.prototype.ESC = 27;
	SearchWidget.prototype.AUTOCOMPLETE_PAGE_SIZE = 20;
	SearchWidget.prototype.currentSelected = -1;
	SearchWidget.prototype.old_input_state = '';
	SearchWidget.prototype.timer_input_event = null;
	SearchWidget.prototype.search_timeout = null;
	SearchWidget.prototype.autocomple_offset = 1;

	window.SearchWidget = SearchWidget;
})(window);