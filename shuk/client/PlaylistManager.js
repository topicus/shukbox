(function(window){

	function PlaylistManager(){
		var that = this;
		
		this.newList = function(temp){
			saved = typeof temp !== 'undefined' ? temp : false;
			if(Meteor.user()){
				console.log(Meteor.user());
			    var name = 'Untitled-list';
			    Meteor.call('addPlaylist', {name:name, user:Meteor.user()._id,saved:saved, blocked:false}, function(error,response){
					if(Meteor.user())
					Session.set('owner', Meteor.user()._id);                      
					Router.setList(response);
			    });    
			}
		};		
		this.setList = function(listkey){
			Router.setList(listkey);
		};		
		this.setSongToCopy = function(id){
			console.log("CALLING SONG TO COPY");
			PlaylistManager.songToCopy = id;
		};
		this.copySongToList = function(listkey){
			var song = Songs.findOne(PlaylistManager.songToCopy);
			console.log("SONG TO COPY: " + PlaylistManager.songToCopy);
			delete song._id;
			song.added_by = Meteor.user()._id;
			song.listkey = listkey;
			Meteor.call('addSong',song);
		};
		this.votePlaylist=function(listkey){
		    var vote = PlayLists.find({_id:listkey, voters:{$in:[Meteor.user()._id]}}).count();
		    if(!vote)
		      PlayLists.update({_id:listkey},{$inc:{score:1}, $push:{voters:Meteor.user()._id}});
		    return false;
		};	
		this.saveList = function(e) {
			
			Meteor.flush();
			var plo = PlayLists.findOne({_id:Session.get('listkey')});
			if(plo.user === Meteor.user()._id){
				var l = (Session.get('edited')) ? Session.get('edited') : Session.get('listkey');
				PlayLists.update({_id:l}, { $set:{name:$('#listname').val(), saved:true} });
				Session.set('edited', null);
				Meteor.call("addActivity", {user_obj:Session.get('fulluser'), action:"listened to", resource:plo.name});
			}else{
				delete plo._id;
				delete plo.name;
				plo.user = Meteor.user()._id;
				plo.saved = true;
				plo.name = $('#listname').val();
				plo.voters = [];
				plo.score = 0;
				Meteor.call('addPlaylist', plo, function(error,response){
					
					Songs.find({listkey:Session.get('listkey')}).forEach(function(item){      
						delete item._id;
						item.voters = [];
						item.score = 0;        
						item.listkey = response;
						Songs.insert(item);
					});  
					var playlist = PlayLists.findOne(response);
					Meteor.call("addActivity", {user_obj:Session.get('fulluser'), action:"listened to", resource:plo.name});
				});		    
			}
		};	
		this.deleteList = function(t){
		    Session.set('listkey', undefined);
		    PlayLists.remove(t._id);
		    playManager.newList();
		};	
		this.addSong = function(jselector){
			Meteor.flush();
			var vid = get_youtube_id(jselector.children('a').attr("href"));
			var title = jselector.children('a').attr("title");
			var user_logged = Session.get('fulluser');
			var fbid = (user_logged.services.facebook) ? user_logged.services.facebook.id : false;
			var goid = (user_logged.services.google) ? user_logged.services.google.id : false;

			var song = {
				name: vid,
				fbid:fbid,
				goid:goid,
				score: 0,
				title:title,
				listkey:Session.get('listkey'),
				added_by:Meteor.user()._id
			};
			Meteor.call('addSong', song);
			$("#autocompleter").hide();
			currentSelected = -1;
			$('.nextsong').val('');  
		};
	}
	PlaylistManager.songToCopy = null;
	window.PlaylistManager = PlaylistManager;
})(window);