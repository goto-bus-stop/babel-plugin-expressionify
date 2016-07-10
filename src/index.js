function expressionify (path) {
  const transform = {
    ForStatement () {

    }
  }[path.type]
  if (transform) {
    return transform(path)
  }
  return path
}

export default function ({ types: t }) {
  const arrow = (params, body, args = []) => t.callExpression(
    t.arrowFunctionExpression(
      params, body
    ),
    args
  )

  return {
    visitor: {
      ArrowFunctionExpression (path) {
        const body = path.get('body')
        if (body.isBlockStatement() && body.get('body').length === 1) {
          const st = body.get('body')[0]
          if (st.isExpressionStatement()) {
            path.replaceWith(
              t.arrowFunctionExpression(
                path.node.params,
                st.node.expression
              )
            )
          }
        }

        if (!path.parentPath.isCallExpression()) {
          return
        }
        if (path.get('params').length > 0) {
          return
        }

        if (body.type && body.isExpression()) {
          path.parentPath.replaceWith(body)
        }
      },
      Program (path) {
        if (path.get('body').length === 1) {
          return
        }
        path.replaceWith(
          t.program([
            t.expressionStatement(
              t.callExpression(
                t.arrowFunctionExpression([],
                  t.blockStatement(path.node.body)
                ),
                []
              )
            )
          ])
        )
      },
      VariableDeclaration (path) {
        const { declarations } = path.node
        const scopePath = path.scope.path
        const body = t.isExpression(scopePath.node) ? scopePath.node : t.blockStatement([ scopePath.node ])
        scopePath.replaceWith(
          t.callExpression(
            t.arrowFunctionExpression(declarations.map((decl) => decl.id), body),
            declarations.map((decl) => decl.init)
          )
        )
        path.remove()
      },
      BlockStatement (path) {
        // path.replace(t.sequenceExpression(path.node.body.map(expressionify)))
      },
      ForStatement: { exit (path) {
        const id = path.scope.generateUidIdentifier('for')
        path.replaceWith(
          t.expressionStatement(
            t.callExpression(
              t.functionExpression(
                id,
                [],
                t.blockStatement([
                  t.expressionStatement(t.conditionalExpression(path.node.test,
                    t.sequenceExpression([
                      path.node.update,
                      arrow([], path.node.body),
                      t.callExpression(id, [])
                    ]),
                    t.identifier('null')
                  ))
                ])
              ),
              []
            )
          )
        )
      } },
      Statement (path) {
        console.log('statement', path.type)
      }
    }
  }
}
