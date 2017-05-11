"use strict";
let blog = {}

blog.API_URL = "http://localhost"
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

blog.getRestOfTemplates = function(){
    let self = this;
    let template = this.templates["/posts/create"]
    $.get(template.location, function(data){
        template.data = data
    })
}

blog.getFirstTemplate = function(){
    let self = this;
    let template = this.templates[window.location.pathname]
    $.get(template.location, function(data){
        template.data = data
        self.router.resume();
        self.router.navigate(window.location.pathname)
    })
}

blog.routes = {
    "/": function(){
        blog.changeContent("/");
    },
    "/posts/create": function(){
        blog.changeContent("/posts/create");
    }
}

blog.changeContent = function(templateLocation){
    let template = this.templates[templateLocation]["data"]
    let self = this;
    if(this.content){
        $.get(this.API_URL+"/", function(data){
            self.content.html(nunjucks.renderString(template, {"posts": data}));
        })
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
    blog.router.pause();
    blog.initializeRoutes();
    blog.getFirstTemplate();
    blog.getRestOfTemplates();
})
