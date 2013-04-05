'''
    DynamicForm.py

    Defines the DynamicForm concept (a page made up entirely of page controls / request handlers so that
    any part of the page can be updated independently

    Copyright (C) 2013  Timothy Edmund Crosley

    This program is free software; you can redistribute it and/or
    modify it under the terms of the GNU General Public License
    as published by the Free Software Foundation; either version 2
    of the License, or (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program; if not, write to the Free Software
    Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
'''

from itertools import chain

from WebElements.All import Factory
from WebElements import UITemplate
from WebElements.HiddenInputs import HiddenValue
from . import PageControls
from .RequestHandler import RequestHandler
from WebElements.Resources import ResourceFile, ScriptContainer

try:
    from django.core.context_processors import csrf
except ImportError:
    csrf = False


class DynamicForm(RequestHandler):
    """
        Defines the base dynamic form  - a page made where any section can be updated independently from the rest
    """
    template = UITemplate.fromSHPAML("> document")
    elementFactory = Factory
    formatted = False
    resourceFiles = ('js/WebBot.js', 'stylesheets/Site.css')
    if csrf:
        sharedFields = ('csrfmiddlewaretoken', )

    def renderResponse(self, request):
        """
            Override the response rendering to render the main document structure of the page
        """
        document = self.elementFactory.buildFromTemplate(self.template)
        request.response.scripts =  ScriptContainer()
        request.response.scripts.addScript("\n".join(self.initScripts))
        document.setScriptContainer(request.response.scripts)
        document.setProperty('title', self.title(request))
        document.addChildElement(ResourceFile()).setProperty("file", self.favicon(request))
        for resourceFile in set(self.requestResourceFiles(request) + self.resourceFiles):
            document.addChildElement(ResourceFile()).setProperty("file", resourceFile)

        if csrf:
            token = document.body.addChildElement(HiddenValue('csrfmiddlewaretoken'))
            token.setValue(csrf(request.native)['csrf_token'])
        document.body += self.mainControl
        document.body += request.response.scripts

        self.modifyDocument(document, request)

        return document.toHTML(formatted=self.formatted, request=request)

    def modifyDocument(self, document, request):
        """
            Override to change the structure of the base document
        """
        pass

    def title(self, request):
        """
            Returns the title of the page - by default this is the class name of the DynamicForm subclass
            override this method to change that
        """
        return self.__class__.__name__

    def favicon(self, request):
        """
            Returns the title of the page - by default this is the class name of the DynamicForm subclass
            override this method to change that
        """
        return "images/favicon.png"

    def requestResourceFiles(self, request):
        """
            Returns the resource files that should be loaded with this page by request - override this to change
        """
        return ()

    class MainControl(PageControls.PageControl):
        """
            Override this controller to define how the body of the page should render
        """
        pass
