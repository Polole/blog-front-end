"use strict";
let blog = {}

blog.content = null;
blog.router = new Navigo(null);
blog.createTemplateSkeleton = function(templateLocation){
    return {
        "data": null,
        "location": "/templates/" + templateLocation
    }
}
blog.templates = {
    "/": blog.createTemplateSkeleton("index.html"),
    "/posts/create": blog.createTemplateSkeleton("create_posts.html")
};

blog.getFirstTemplate = function(){
    let self = this;
    let template = this.templates[window.location.pathname]
    this.router.pause()
    $.get(template.location, function(data){
        template.data = data
        self.router.navigate(window.location.pathname)
        self.router.resume();
    })
}

blog.routes = {
    "/": function(){
        blog.changeContent();
    },
    "/posts/create": function(){
        blog.changeContent();
    }
}

blog.changeContent = function(){
    let template = this.templates[window.location.pathname]["data"]
    if(this.content){
        this.content.html(nunjucks.renderString(template, {"var": "shrek"}));
    } else {
        throw Error("Content did not exist at this time.");
    }
}

blog.initializeRoutes = function(){
    this.router.on(this.routes).resolve();
}

$(document).ready(function(){
    nunjucks.configure({"autoescape": true})
    blog.content = $('#content');
    blog.getFirstTemplate()
    blog.initializeRoutes();
})
