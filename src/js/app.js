"use strict";
let app = new Templateify("/api", "/templates", "content");
app.env.addFilter('realDate', function(str){
    let date = moment(str);
    return date.format("dddd, MMMM Do YYYY @ h:mm a");
});
app.env.addFilter('fromNow', function(str){
    let date = moment(str);
    return date.fromNow();
});
app.env.addFilter('tagify', function(tags){
    let tagged = "";
    if(!tags){
        tags = [];
    }
    if(tags.length > 0) {
        tagged = tags[0].tag;
    }
    for(let tag of tags.slice(1)) {
        tagged += ", " + tag.tag;
    };
    return tagged;
});

(function(){
    app.loadingFunc = function(xhr){
        setTimeout(function(){
            if(xhr.readyState != 4){
                $('.pageloader').addClass("is-active");
            }
        }, 300)
    };
    app.doneFunc = function(){
        $('.pageloader').removeClass("is-active");
    };
    class JWTAuth extends TemplateifyAuth {

        constructor(url, callbackUrl){
            super(url, callbackUrl)
        }

        loginCallback(email, password){
            return $.ajax({
                "contentType": "application/json",
                "type": "POST",
                "url": this.url,
                "data": JSON.stringify({"email": email, "password": password}),
                "dateType": "json"
            })
        }

        authHeaders(xhr){
            xhr.setRequestHeader("Authorization", `JWT ${this.token}`)
        }

        get token() {return this.data && this.data.auth_token}

    }

    let jwtAuth = new JWTAuth(app.url("/auth/login"), "/")
    app.auth = jwtAuth;

    let parentSettings = {
        htmlInit: function(templateify){
            $('.navbar-burger').click(function(){
                let $this = $(this)
                let $targ = $('#'+$this.data("target"))
                $this.toggleClass("is-active")
                $targ.toggleClass("is-active")
            })
        }
    }
    app.parentTemplate = new TemplateifyTemplate(null, "main.html",parentSettings)

    app.notFoundFunc = function(){
        let self = this;
        let parentTemplate = this.parentTemplate
        return function(){
            self.doFailRender(parentTemplate, "404: page not found")
        }
    }

    let indexSettings = {
        apiLocation: "/posts",
        urlConstructor: function(params){
            return this.apiLocation + window.location.search;
        },
        callback: function(templateify, data){
            return data;
        }
    }
    app.addTemplate("index", new TemplateifyTemplate("/", "index.html", indexSettings))

    let postSettings = {
        apiLocation: "/posts",
        callback: function(templateify, data){
            return {
                "post": data
            }
        },
        urlConstructor: function(params){
            return this.apiLocation + "/" + params.id
        },
        htmlInit: function(templateify){
            let params = templateify.currentParams;
            let self = this;
            $('#delete').click(function(){
                let requestOptions = {
                    requestMethod: "DELETE"
                }
                templateify.requestWithAuth(self.urlConstructor(params), requestOptions).then(function(){
                    templateify.navigateByViewName("index");
                }).catch(function(){
                    templateify.doFailRender(self, "Could not delete post. Are you logged in?")
                })
            })
            $('#open').click(function(){
                $('#delete-dialog').addClass("is-active");
            })
            $('.close-dialog').click(function(){
                $('.modal').removeClass("is-active");
            })
            $('.modal-background').click(function(){
                $('.modal').removeClass("is-active");
            })
            $('#edit').click(function(){
                templateify.navigateByViewNameWithData("editPostView", templateify.currentData.post)
            })
            $('img').click(function(){
                $('#image-modal').addClass("is-active")
                $('#image-box').html(this.cloneNode());
            })
        }
    }
    app.addTemplate("postView", new TemplateifyTemplate("/post/:id", "posts.html", postSettings))

    let modifyPostFunction = function(requestMethod){
        return function(templateify){
            let self = this;
            let content = $(templateify.content);
            if(content.find('#editor').length){
                CKEDITOR.replace('editor')
                content.find('#submit').click(function(event){
                    let title = $('#title').val() || "Arbitrary Title";
                    let tags = $('#tags').val();
                    let data = JSON.stringify({
                        "title": title,
                        "content": CKEDITOR.instances.editor.getData(),
                        "tags": tags
                    })
                    let requestOptions = {
                        data: data,
                        requestMethod: requestMethod || self.requestMethod
                    }
                    templateify.requestWithAuth(self.urlConstructor(templateify.currentParams), requestOptions).then(function(data){
                        templateify.navigateByViewName("postView", {"id": data.id})
                    }).catch(function(data, textStatus, errorThrown){
                        templateify.doFailRender(self, "Failed to submit post. Are you sure you're correctly logged in? If not, log out then try log in again.")
                    })
                })
            }
        }
    }


    let createPostSettings = {
        apiLocation: "/posts",
        requestMethod: "POST",
        htmlInit: modifyPostFunction()
    }
    app.addTemplate("createPostView", new TemplateifyTemplate("/posts/create", "create_posts.html", createPostSettings))

    let editPostSettings = {
        apiLocation:"/posts",
        urlConstructor: function(params){
            return this.apiLocation + "/" + params.id
        },
        htmlInit: modifyPostFunction("PATCH")
    }
    app.addTemplate("editPostView", new TemplateifyTemplate("/post/:id/edit", "edit_posts.html", editPostSettings))

    let loginSettings = {
        htmlInit: function(templateify){
            let self = this;
            $('#login').click(function(){
                templateify.auth.login($('#username').val(), $('#password').val()).then(function(){
                    templateify.navigateByViewName("index")
                }).fail(function(data, textStatus, errorThrown){
                    templateify.doFailRender(self, "Failed to login. Are you sure your username and password are correct?")
                })
            })
        }
    }
    app.addTemplate("loginView", new TemplateifyTemplate("/login", "login.html", loginSettings))

    let logoutSettings = {
        htmlInit: function(templateify){
            templateify.auth.logout();
            templateify.navigateByViewName("index")
        }
    }
    app.addTemplate("logoutView", new TemplateifyTemplate("/logout", null, logoutSettings))
})();
