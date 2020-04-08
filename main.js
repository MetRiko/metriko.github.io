var antlr4 = require('antlr4/index');
var CalculLexer = require('antlr-parser/generated-parser/calculLexer').calculLexer;
var CalculParser = require('antlr-parser/generated-parser/calculParser').calculParser;
var CalculListener = require('antlr-parser/generated-parser/calculListener').calculListener;
var EvalCalculVisitor = require('antlr-parser/my-impl/EvalCalculVisitor').EvalCalculVisitor;
var CompileCalculVisitor = require('antlr-parser/my-impl/CompileCalculVisitor').CompileCalculVisitor;

function parse(script) {
    let chars = new antlr4.InputStream(script + "\n");
    let lexer = new CalculLexer(chars);
    let tokens  = new antlr4.CommonTokenStream(lexer);
    let parser = new CalculParser(tokens);
    parser.buildParseTrees = true;
    let tree = parser.program();
    return {
        "tree": tree, 
        "parser": parser, 
        "lexer": lexer
    };
}

document.getElementById("parse").onclick = function(){
    var input = document.getElementById("code").value;

    var result = parse(input);
    console.log("Parsed: ", result.tree);

    result.tree.accept(new EvalCalculVisitor());
};

document.getElementById("clear").onclick = function(){
    document.getElementById("output").value = ""
};

document.getElementById("compile").onclick = function(){
    document.getElementById("assembly").value = ""
    var input = document.getElementById("code").value;

    var result = parse(input);
    console.log("Parsed: ", result.tree);

    result.tree.accept(new CompileCalculVisitor());
};



// class Visitor {
//     visitChildren(context) {
//         if (!context) return;

//         if (context.children) {
//             return context.children.map(ch)
//         }
//     }
// }




// var updateTree = function(tree, ruleNames) {
//     var container = document.getElementById("tree");
//     while (container.hasChildNodes()) {
//         container.removeChild(container.lastChild);
//     }
//     for (var i = 0; i < tree.children.length; i++) {
//         var child = tree.children[i];
//         var nodeType = ruleNames[child.ruleIndex];
//         if (nodeType == "line") {
//             var newElement = document.createElement("div");
//             newElement.className = "calculElement";
//             var newElementText = document.createTextNode(child.children[2].getText());
//             newElement.appendChild(newElementText);
//             container.appendChild(newElement);
//         }
//     }
// };
