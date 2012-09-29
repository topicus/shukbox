Meteor.startup(function(){
	Session.set('activities', null);

	Template.activities.activities = function() {
		return Activities.find( {},{sort:{when:-1}} );
	};
	Template.activities.events({
		'click li':function(e){
			console.log(this.collection_id);
			playManager.set(this.collection_id);
		}	
	});

	Template.toptenlist.topten = function() {
		return TopTenLists.find( {},{sort:{score:-1}} );
	};
	Template.toptenlist.events({
		'click li':function(e){
			playManager.set(this._id);
		}	
	});
});
