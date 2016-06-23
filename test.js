function (e) {
    var t = $j(e.target);
    $j("#user_auto_add_fb_friends").prop("checked", "true" == t.find("#auto_add_fb_friends_confirm").val()), $j.post(t.attr("action"), t.serialize()).success(function () {
        Lightbox.hideBox()
    }).error(function () {
        alert("There was an error saving your preference. Please try again.")
    }), e.preventDefault()
}