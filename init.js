var testCode = `
var x
var y = 4
x = (3 + y) * 2
x
y
x + y


var z = 0
var lol = if z == 1 then 111 else 101
lol

a
{
    var a = 33
    a
    {
        var a = 66
        a
    }
    a
}
a

if 1 == 2 {
    1
}
else {
    2
}

var counter = 4

while counter {
    counter = counter - 1
    counter
}

var c = 0
if c {
    100
}
else {
    -100
}

func countTo3 {
    var ctl = 1
    ctl
    while ctl <= 3 {
        ctl = ctl + 1
        ctl
    }
    x = x + 1
    x
}

countTo3
countTo3
countTo3

func nestedFunc {
    func nestedFunc1 {
        func nestedFunc2 {
            func nestedFunc3 {
                9
            }
            6
            nestedFunc3
        }
        3
        nestedFunc2
    }
    nestedFunc1
}
nestedFunc

`.trim();

var testCodeToCompile = `
var x
x = (3 + y) * 2
`.trim();

window.onload = function() {
    document.getElementById("code").value = testCode;
}
