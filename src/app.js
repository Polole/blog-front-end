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

blog.API_URL = "http://localhost:5000";
blog.content = null;
blog.router = new Navigo(window.location.origin + "/");
blog.loginStatus = false;
blog.xhr = false;
blog.missingTemplate = null;
blog.createTemplateSkeleton = function(templateLocation, apiLocation){
    let object = {
        "data": null,
        "location": "/templates/" + templateLocation,
        "api": null,
        "urlConstructor": function(params){ return this.api },
        "callback": function(blog){ return {} }
    };
    if(apiLocation){
        object["api"] = this.API_URL + apiLocation;
    };
    return object
};

blog.getRestOfTemplates = function(){
    let self = this;
    for(let property in this.templates){
        if(!this.templates.hasOwnProperty(property)) continue;
        let template = this.templates[property];
        if(template.location != blog.firstTemplate){
            $.get(template.location, function(data){
                template.data = data;
                if(self.missingTemplate){
                    if(template.location == self.missingTemplate.location){
                        self.changeContent(property, self.missingTemplate.params);
                        self.missingTemplate = false;
                    }
                }
            });
        };
    }
};

blog.getFirstTemplate = function(){
    let self = this;
    let templateLocation = null;
    for(var regex in this.regexMap){
        if(!this.regexMap.hasOwnProperty(regex)) continue;
        let regexp = new RegExp(regex);
        if(regexp.test(window.location.pathname)){
            templateLocation = this.regexMap[regex];
        }
    }
    if(!templateLocation){
        templateLocation = window.location.pathname;
    }
    let template = this.templates[templateLocation]
    if(template){
        blog.firstTemplate = template.location;
        $.get(template.location, function(data){
            template.data = data
            self.initializeRoutes();
        });
    } else {
        self.initializeRoutes();
    }
};

blog.abortXhr = function(){
    this.xhr && this.xhr.abort();
    this.xhr = null;
}

blog.changeContent = function(templateLocation, params){
    let template = this.templates[templateLocation];
    let self = this;
    if(template.data){
        this.abortXhr();
        let getUrl = template.urlConstructor(params);
        if(getUrl){
            blog.xhr = $.get(getUrl, function(data){
                self.content.html(nunjucks.renderString(template.data, template.callback(self, data)));
            });
        } else {
            self.content.html(nunjucks.renderString(template.data, template.callback(self)));
        };
    } else {
        this.missingTemplate = {
            "location": template.location,
            "params": null
        };
        if(params){
            this.missingTemplate["params"] = params;
        };
    };
};

blog.initializeRoutes = function(){
    let self = this;
    this.router.notFound(function(){
        self.content.html("Not found!");
    })
    this.router.on(this.routes).resolve();
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
    let postTemplate = blog.createTemplateSkeleton(
        "posts.html",
        "/post"
    )
    postTemplate.callback = function(blog, object){
        return {
            "post": object
        }
    }
    postTemplate.urlConstructor = function(params){
        return this.api + "/" + params.id;
    }
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
        "/post": postTemplate,
        "/posts/create": createPostsTemplate
    });
    blog.regexMap = makeIterable({
        "/post/.+": "/post"
    })
})(blog);

blog.routes = {
    "/":{
        as: 'index',
        uses: function(){
            blog.changeContent("/");
        }
    },
    "/post/:id": {
        as: 'posts.view',
        uses: function(params){
            blog.changeContent("/post", params)
        }
    },
    "/posts/create":{
        as: 'posts.create',
        uses: function(){
            blog.changeContent("/posts/create");
        }
    }
}

$(document).ready(function(){
    nunjucks.configure({"autoescape": true})
    blog.content = $('#content');
    blog.getFirstTemplate();
    blog.getRestOfTemplates();
})
