"use strict";

let app = new Templateify("http://localhost:5000", "/templates", "content");

(function(){
    let indexSettings = {
        apiLocation: "/",
        callback: function(templateify, data){
            return {
                "posts": data
            }
        }
    }
    app.addTemplate("index", new TemplateifyTemplate("/", "index.html", indexSettings))

    let postSettings = {
        apiLocation: "/post",
        callback: function(templateify, data){
            return {
                "post": data
            }
        },
        urlConstructor: function(params){
            return this.apiLocation + "/" + params.id
        }
    }
    app.addTemplate("postView", new TemplateifyTemplate("/post/:id", "posts.html", postSettings))

    let createPostSettings = {
        apiLocation: "/post",
        requestMethod: "POST",
        callback: function(templateify){
            return {
                "loggedIn": templateify.loginStatus
            }
        },
        htmlInit: function(blog){
            let self = this;
            let content = blog.content;
            if(content.find('#editor').length){
                CKEDITOR.replace('editor')
                content.find('#submit').click(function(event){
                    let data = JSON.stringify({
                        "title": "Some Title",
                        "content": CKEDITOR.instances.editor.getData()
                    })
                    $.ajax({
                        "contentType": "application/json",
                        "type": self.requestMethod,
                        "url": self.api,
                        "data": data,
                        "dataType": "json"
                    })
                })
            }
            blog.router.updatePageLinks()
        }
    }
    app.addTemplate("createPostView", new TemplateifyTemplate("/posts/create", "create_posts.html", createPostSettings))
})();

