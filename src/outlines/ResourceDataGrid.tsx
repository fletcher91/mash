import { Grid, Table, TableBody, TableCell, TableHead, TableRow } from "@material-ui/core";
import { makeStyles } from "@material-ui/styles";
import { LinkedResourceContainer, useLRS } from "link-redux";
import { SomeTerm, Statement } from "rdflib";
import * as React from "react";

import { DataGridTopology } from "../topologies";
import { DataGridCellListItem } from "../topologies/DataGrid/DataGridCellListItem";
import { LDLink } from "../components/LDLink";
import { tryShorten } from "../helpers/iris";
import { PersonTypes, ThingTypes } from "../helpers/types";
import { NS } from "../LRS";

const PROPKEY = 0;
const STATEMENTS = 1;
const MAX_STMTS_DISPLAYED = 50000;

const useStyles = makeStyles({
  breakCell: {
    wordBreak: "break-word",
  },
  breakCellLink: {
    position: "sticky",
  },
  breakLabel: {
    minWidth: "4em",
    paddingLeft: ".5em",
    paddingRight: ".5em",
    position: "sticky",
    verticalAlign: "initial",
    wordBreak: "break-word",
  },
});

export const ResourceDataGrid = ({ subject }) => {
  const lrs = useLRS();
  const classes = useStyles({});

  if (!subject) {
    return <p>No article selected</p>;
  }

  const statementMap = lrs
    .tryEntity(subject)
    .reduce((acc, cur: Statement) => {
      const accI = acc.findIndex((obp) => obp[PROPKEY] === cur.predicate);
      if (accI === -1) {
        acc.push([cur.predicate, new Set([cur.object])]);
      } else {
        acc[accI][STATEMENTS].add(cur.object);
      }

      return acc;
    }, []);

  return (
    <Grid container lg={9} xl={8}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Predicate</TableCell>
            <TableCell>Object</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {statementMap.slice(0, MAX_STMTS_DISPLAYED).map((row, i) => (
            <TableRow key={`${row.toString()}-${i}`}>
              <TableCell className={classes.breakLabel} variant="head">
                {/*<LinkedResourceContainer subject={row[PROPKEY]} />*/}
                <LDLink className={classes.breakCellLink} to={row[PROPKEY]}>
                  {tryShorten(row[PROPKEY])}
                </LDLink>
              </TableCell>
              <TableCell className={classes.breakCell}>
                <ul>
                  {(Array.from(row[STATEMENTS]) as SomeTerm[]).map((s: SomeTerm, index) => {
                    if (s.termType === "NamedNode") {
                      const children = s.value.startsWith(NS.dbo("").value)
                        ? <LinkedResourceContainer subject={s}/>
                        : <LDLink to={s}>{s.toString()}</LDLink>;

                      return (
                        <DataGridCellListItem key={s.value}>
                          {children}
                        </DataGridCellListItem>
                      );
                    }

                    return <li key={`${s.value}-${index}`}><p>{s.toString()}</p></li>;
                  })}
                </ul>
              </TableCell>
            </TableRow>
          ))}
          {statementMap.length > MAX_STMTS_DISPLAYED &&
          <p>First 50.000 of {statementMap.length} statements shown</p>
          }
        </TableBody>
      </Table>
    </Grid>
  );
};

ResourceDataGrid.type = [
  NS.rdfs("Resource"),
  ...PersonTypes,
  ...ThingTypes,
];

ResourceDataGrid.topology = DataGridTopology;
