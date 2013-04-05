'''
    The Home Page for %(label)s
'''

import os

import logging as log
from WebElements import UITemplate

from Models.Post import Post

try:
    from WebBot import Page, PageControls
except ImportError:
    from ...WebBot import Page, PageControls

APP_DIR = os.path.dirname(__file__) + "/"

class Home(Page):
    class ContentControl(PageControls.TemplateControl):
        template = UITemplate.fromFile(APP_DIR + "Template.wui")

        def initUI(self, ui, request):
            ui.postCreator.replaceWith(self.postCreator)
            ui.posts.replaceWith(self.posts)

        class PostCreator(PageControls.TemplateControl):
            template = UITemplate.fromFile(APP_DIR + "PostCreator.wui")

            def initUI(self, ui, request):
                ui.post.clientSide.on('click', self.clientSide.post())

            def validPost(self, ui, request):
                ui.insertVariables(request.fields.copy())
                return not ui.query().filter(classes__contains="WError")

            def processPost(self, ui, request):
                Post(text=request.fields.get('text'), email=request.fields.get('email')).put()
                ui.text.setValue("")
                ui.text.clientSide.focus()

        class Posts(PageControls.TemplateControl):
            template = UITemplate.fromFile(APP_DIR + "Posts.wui")
            autoReload = 1000

            def initUI(self, ui,request):
                ui.pager.connect('jsIndexChanged', None, self.clientSide, 'get', True)

            def setUIData(self, ui, request):
                allPosts = Post.all().order('-created')
                posts = ui.pager.currentPageItems(allPosts, request.fields)

                for post in posts:
                    row = ui.posts.addRow()
                    row.setCell('', self.buildElement('gravatar', properties={'email':post.email or ""}))
                    row.cell('Email').setText(post.email)
                    row.cell('Text').setText(post.text)

