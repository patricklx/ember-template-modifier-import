'use strict';

/* eslint-env node */

import * as glimmer from "@glimmer/syntax";
import path from "path";
import BroccoliFilter from "broccoli-persistent-filter";
import {ElementNode, MustacheStatement, PathExpression, Program} from "@glimmer/syntax/dist/types/lib/types/nodes";
import {AST} from "@glimmer/syntax";


function isValidVariableName(name) {
  return /^[A-Za-z0-9.-]+$/.test(name);
}

class TemplateImportProcessor extends BroccoliFilter {
  extensions: string[];
  targetExtension: string;
  options: any;
  _console: any;

  constructor(inputNode, options: any = {}) {
    if (!options.hasOwnProperty('persist')) {
      options.persist = true;
    }

    super(inputNode, {
      annotation: options.annotation,
      persist: options.persist
    });

    this.options = options;
    this._console = this.options.console || console;

    this.extensions = ['hbs', 'handlebars'];
    this.targetExtension = 'hbs';
  }

  baseDir() {
    return __dirname;
  }

  parseImports(body: Program["body"], relativePath) {
    const imports: { used?: boolean, node: MustacheStatement, localName: string, importPath: string, isLocalNameValid: boolean, dynamic?: boolean }[] = [];
    body.forEach((node: MustacheStatement) => {
      const isImportPath = node.path && node.path.type === 'PathExpression' && node.path.original === 'import';
      if (isImportPath) {
        const params = node.params.map(p => (p as PathExpression).original);
        const localName = params.slice(0, -2).join(' ');
        let importPath = params.slice(-1)[0];
        if (importPath.endsWith('.scss')) { // .scss or other extensions
          return;
        }
        if (importPath.startsWith('.')) {
          importPath = path.resolve(relativePath, '..', importPath).split(path.sep).join('/');
          importPath = path.relative(this.options.root, importPath).split(path.sep).join('/');
        }
        const hasMultiple = localName.includes(',')
        const localNames = localName.replace(/['"]/g, '').split(',');
        localNames.forEach((localName) => {
          localName = localName.trim();
          let importName = localName;
          if (localName.includes(' as ')) {
            [importName, localName] = localName.split(' as ');
            importName = importName.trim();
            localName = localName.trim();
          }
          if (importName === '*') {
            const name = localName + '\\.([^\\s\\)} |]+)';
            imports.push({ node, dynamic: true, localName: name, importPath: importPath + '/', isLocalNameValid: isValidVariableName(localName) });
            return;
          }
          imports.push({ node, localName, importPath: importPath + (hasMultiple ? ('/' + importName) : ''), isLocalNameValid: isValidVariableName(localName) });
        });
      }
    });
    return imports;
  }

  replaceModifiersInAst(ast: AST.Template, relativePath) {
    const imports = this.parseImports(ast.body, relativePath);
    const heap = [...ast.body] as any[];

    while (heap.length > 0) {
      const node = heap.shift() as ElementNode;
      if (node.modifiers) {
        node.modifiers.forEach((modifier) => {
          const path = modifier.path as PathExpression;
          const i = imports.find((imp) => {
            if (imp.dynamic) {
              const re = new RegExp(imp.localName);
              return re.test(path.original);
            }
            return path.original === imp.localName;
          });
          if (!i) {
            if (!this.options.failOnBadImport) {
              console.warn('modifier', path.original, 'is not imported');
            } else {
              throw new Error(`modifier ${path.original} is not imported`)
            }
            return;
          }
          modifier.params.splice(0, 0, {
            type: 'StringLiteral',
            value: i.dynamic ? i.importPath + path.original.split('.')[1] : i.importPath,
            original: i.dynamic ? i.importPath + path.original.split('.')[1] : i.importPath,
            loc: {} as any
          });
          path.original = 'ember-template-modifier-imports/modifier/invoke-modifier';
          i.used = true;
        });
      }
      if (node.children) {
        heap.push(...node.children);
      }
    }
    imports.forEach((imp) => {
      if (imp.used) {
        const index = ast.body.indexOf(imp.node);
        ast.body.splice(index, 1);
      }
    })
  }

  processString(contents, relativePath) {
    const ast = glimmer.preprocess(contents);
    this.replaceModifiersInAst(ast, relativePath);
    return glimmer.print(ast);
  }
}

module.exports = {
  name: require('./package').name,

  setupPreprocessorRegistry(type, registry) {
    registry.add('template', {
      name: 'ember-template-modifier-import',
      ext: 'hbs',
      before: ['ember-template-helper-import', 'ember-template-component-import'],
      toTree: (tree) => {
        tree = new TemplateImportProcessor(tree, { root: this.project.root });
        return tree;
      }
    });

    if (type === 'parent') {
      this.parentRegistry = registry;
    }
  },
};
