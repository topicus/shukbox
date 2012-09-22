Session.set('activities', null);

Template.activities.activities = function(argument) {
	return Activities.find( {},{sort:{when:-1}} );
};
Template.activities.events({
	'click li':function(e){
		playManager.setList(this._id);
	}	
});

Template.toptenlist.topten = function(argument) {
	return TopTenLists.find( {},{sort:{score:-1}} );
};
Template.toptenlist.events({
	'click li':function(e){
		playManager.setList(this._id);
	}	
});