"use strict";
let makeIterable = function(object){
    object[Symbol.iterator] = function *(){
        let names = Object.getOwnPropertyNames(this);
        let i = 0;
        while(i < names.length){
            yield this[names[i]];
            i++;
        }
    }
    return object
}

let blog = makeIterable({})

blog.API_URL = "http://localhost:5000"
blog.content = null;
blog.router = new Navigo(null);
blog.loginStatus = true;
blog.createTemplateSkeleton = function(templateLocation, apiLocation){
    let object = {
        "data": null,
        "location": "/templates/" + templateLocation,
        "api": null
    };
    if(apiLocation){
        object["api"] = this.API_URL + apiLocation;
    };
    return object
};
(function(blog){
    let indexTemplate = blog.createTemplateSkeleton(
        "index.html",
        "/"
    );
    indexTemplate.callback = function(blog, object){
        return {
            "posts": object
        };
    };
    let createPostsTemplate = blog.createTemplateSkeleton(
        "create_posts.html",
        null
    );
    createPostsTemplate.callback = function(blog){
        return {
            "loggedIn": blog.loginStatus
        };
    };
    blog.templates = makeIterable({
        "/": indexTemplate,
        "/posts/create": createPostsTemplate
    });
})(blog);

blog.getRestOfTemplates = function(){
    let self = this;
    for(let template of this.templates){
        if(template.location != blog.firstTemplate){
            $.get(template.location, function(data){
                template.data = data;
            });
        };
    };
};

blog.getFirstTemplate = function(){
    let self = this;
    let template = this.templates[window.location.pathname]
    blog.firstTemplate = template.location;
    $.get(template.location, function(data){
        template.data = data
        self.router.resume();
        self.router.navigate(window.location.pathname)
    });
};

blog.routes = {
    "/": function(){
        blog.changeContent("/");
    },
    "/posts/create": function(){
        blog.changeContent("/posts/create");
    }
}

blog.changeContent = function(templateLocation){
    let template = this.templates[templateLocation]
    let self = this;
    if(this.content){
        if(template.api){
            this.router.pause();
            $.get(this.API_URL+"/", function(data){
                self.content.html(nunjucks.renderString(template.data, template.callback(self, data)));
                self.router.resume();
            })
        } else {
            self.content.html(nunjucks.renderString(template.data, template.callback(self)))
        }
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
