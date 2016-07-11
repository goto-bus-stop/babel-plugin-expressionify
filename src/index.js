import template from 'babel-template'

// Y Combinator for nameless recursion
const recurse = template(`
  fn =>
    (f => f(f))(
      f => fn(
        x => f(f)(x)
      )
    )
`)

const makeForExpression = template(`
  RECURSE(NEXT =>
    () => TEST ? (UPDATE, BODY, NEXT()) : null
  )()
`)

const makeClassExpression = template(`
  const NAME = CLASS
`)

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
      ClassDeclaration (path) {
        path.replaceWith(
          makeClassExpression({
            NAME: path.node.id,
            CLASS: t.classExpression(
              path.node.id,
              path.node.superClass,
              path.node.body,
              path.node.decorators || []
            )
          })
        )
      },
      ForStatement: { exit (path) {
        path.replaceWith(
          makeForExpression({
            RECURSE: recurse(),
            NEXT: path.scope.generateUidIdentifier('next'),
            TEST: path.node.test,
            UPDATE: path.node.update,
            BODY: arrow([], path.node.body)
          })
        )
      } },
      Statement (path) {
        console.log('statement', path.type)
      }
    }
  }
}
