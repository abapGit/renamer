const fs = require("fs");

function parseArguments() {
  let arg = process.argv.slice(2);
  if (arg.length !== 2) {
    throw "Supply input and output directories";
  }

  const input = arg[0];
  const output = arg[1];

  return {input, output};
}

function listFiles(dir) {
  let res = [];
  let files = fs.readdirSync(dir);
  files.forEach(function(file) {
    if (fs.statSync(dir + file).isDirectory()) {
      res = res.concat(listFiles(dir + file + '/'));
    } else {
      res.push({dir: dir, name: file});
    }
  });
  return res;
}

function buildRenameMap(files) {
  let res = [];
  files.forEach(function(file) {
    if (file.name === "package.devc.xml") {
      return;
    }
    let match = file.name.match(/^(.*)\.\w{4}\.xml$/);
    if (match) {
// todo, make this configurable
      res.push({old: match[1], new: match[1].replace(/^z(\w{2})_/, "y$1_")});
    }
  });
  return res;
}

function mkdir(dir) {
  var path = dir.replace(/\/$/, '').split('/');
  for (var i = 1; i <= path.length; i++) {
      var segment = path.slice(0, i).join('/');
      segment.length > 0 && !fs.existsSync(segment) ? fs.mkdirSync(segment) : null ;
  }
}

function rename(arguments, files, map) {
  for(let file of files) {
    let contents = fs.readFileSync(file.dir + file.name, "utf8");
    const targetDir = arguments.output + file.dir.substr(arguments.input.length);

    let targetName = map.find((e) => {
      return file.name.match(new RegExp("^" + e.old + "\\.", "g")); } );

    if(!targetName) {
      targetName = file.name; // eg package.devc.xml
    } else {
      targetName = targetName.new + file.name.match(/^\w+(\..*)$/)[1];
    }

    map.forEach((m) => {
      contents = contents.replace(new RegExp(m.old.toLowerCase(), "g"), m.new.toLowerCase());
      contents = contents.replace(new RegExp(m.old.toUpperCase(), "g"), m.new.toUpperCase());
    });

    mkdir(targetDir);
    fs.writeFileSync(targetDir + targetName, contents);

    console.log(targetDir + targetName);
  }
}

function run() {
  const arguments = parseArguments();
  const files = listFiles(arguments.input);
  const map = buildRenameMap(files);

  rename(arguments, files, map);
}

try {
  run();
} catch (e) {
  process.stderr.write(e + "\n");
  process.exit(1);
}