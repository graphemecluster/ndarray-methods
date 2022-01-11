import * as ts from "typescript";
const { factory } = ts;

export default function Transformer(mainAST: ts.SourceFile, node: ts.SourceFile) {
  const source = mainAST.getFullText();
  return factory.updateSourceFile(node, [
    (statement =>
      factory.updateImportDeclaration(
        statement,
        statement.decorators,
        statement.modifiers,
        statement.importClause,
        factory.createStringLiteral("."),
        statement.assertClause
      ))(mainAST.statements[0] as ts.ImportDeclaration),
    factory.createModuleDeclaration(
      undefined,
      [factory.createModifier(ts.SyntaxKind.DeclareKeyword)],
      factory.createIdentifier("global"),
      factory.createModuleBlock([
        factory.createInterfaceDeclaration(
          undefined,
          undefined,
          "Array",
          [factory.createTypeParameterDeclaration("T")],
          undefined,
          mainAST.statements
            .filter(ts.isFunctionDeclaration)
            .map(method =>
              ts.addSyntheticLeadingComment(
                factory.createMethodSignature(
                  undefined,
                  method.name!,
                  undefined,
                  [
                    (parameter =>
                      factory.updateTypeParameterDeclaration(
                        parameter,
                        parameter.name,
                        (type => (ts.isTypeOperatorNode(type!) ? type.type : type))(parameter.constraint),
                        parameter.default
                      ))(method.typeParameters![0]),
                    ...method.typeParameters!.slice(1),
                  ],
                  [
                    (parameter =>
                      factory.updateParameterDeclaration(
                        parameter,
                        parameter.decorators,
                        parameter.modifiers,
                        parameter.dotDotDotToken,
                        "this",
                        parameter.questionToken,
                        parameter.type,
                        parameter.initializer
                      ))(method.parameters[0]),
                    ...method.parameters.slice(1),
                  ],
                  (type =>
                    ts.isTypePredicateNode(type!)
                      ? factory.updateTypePredicateNode(
                          type,
                          type.assertsModifier,
                          factory.createThisTypeNode(),
                          type.type
                        )
                      : type)(method.type)
                ),
                ts.SyntaxKind.MultiLineCommentTrivia,
                (({ pos, end }) => source.slice(pos + 2, end - 2).replace(/@param \w+/, "@param this"))(
                  ts.getLeadingCommentRanges(source, method.getFullStart())![0]
                ),
                true
              )
            )
        ),
        factory.createInterfaceDeclaration(
          undefined,
          undefined,
          "ReadonlyArray",
          [factory.createTypeParameterDeclaration("T")],
          undefined,
          mainAST.statements
            .filter(ts.isFunctionDeclaration)
            .filter(func => ts.isTypeOperatorNode(func.typeParameters![0].constraint!))
            .map(method =>
              ts.addSyntheticLeadingComment(
                factory.createMethodSignature(
                  undefined,
                  method.name!,
                  undefined,
                  method.typeParameters,
                  [
                    (parameter =>
                      factory.updateParameterDeclaration(
                        parameter,
                        parameter.decorators,
                        parameter.modifiers,
                        parameter.dotDotDotToken,
                        "this",
                        parameter.questionToken,
                        parameter.type,
                        parameter.initializer
                      ))(method.parameters[0]),
                    ...method.parameters.slice(1),
                  ],
                  (type =>
                    ts.isTypePredicateNode(type!)
                      ? factory.updateTypePredicateNode(
                          type,
                          type.assertsModifier,
                          factory.createThisTypeNode(),
                          type.type
                        )
                      : type)(method.type)
                ),
                ts.SyntaxKind.MultiLineCommentTrivia,
                (({ pos, end }) => source.slice(pos + 2, end - 2).replace(/@param \w+/, "@param this"))(
                  ts.getLeadingCommentRanges(source, method.getFullStart())![0]
                ),
                true
              )
            )
        ),
      ]),
      ts.NodeFlags.GlobalAugmentation
    ),
    node.statements[0],
  ]);
}
