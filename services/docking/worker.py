#!/usr/bin/env python
"""
NatureAide docking preparation worker.

Run with the interpreter from DOCKING_PYTHON. Each sub-command prints exactly one JSON
object to stdout. Nothing here scores or docks anything; AutoDock Vina is executed by the
Node server layer. A failure is reported as {"ok": false, "error": "..."}; no output file
is ever fabricated.

Sub-commands
  tools                                  report which preparation libraries are importable
  prep-ligand   --smiles S --out PREFIX  SMILES -> 3D (RDKit ETKDG + force field) -> PDBQT (Meeko)
  prep-receptor --pdb FILE --out PREFIX  clean protein chain -> PDBQT (Open Babel, pH 7.4 H)
  sites         --pdb FILE               candidate binding sites from co-crystallised ligands
"""
import argparse
import json
import os
import subprocess
import sys


def emit(obj):
    sys.stdout.write(json.dumps(obj))
    sys.stdout.flush()


def fail(msg, **extra):
    emit({"ok": False, "error": str(msg), **extra})
    sys.exit(0)


# Residues that are crystallisation artefacts, glycans, buffers, detergents, cofactors or
# prosthetic groups (including heme and cobalt-protoporphyrin COH): never offered as a
# binding-site defining ligand.
NON_SITE_RESNAMES = {
    "HOH", "WAT", "DOD",
    "SO4", "PO4", "GOL", "EDO", "PEG", "PGE", "PG4", "MPD", "ACT", "DMS", "FMT", "TRS", "EPE", "MES", "CIT", "TAR",
    "NAG", "NDG", "BMA", "MAN", "FUC", "GAL", "GLC", "BGC", "SIA", "NA", "CL", "BOG", "LMT", "DMU", "OLC", "LDA",
    "HEM", "HEC", "HEA", "COH", "FAD", "NAD", "NAP", "NDP", "ADP", "ATP", "AMP", "GDP", "GTP", "COA", "SAM", "PLP",
}


def tools(_):
    import shutil
    out = {"ok": True, "python": sys.version.split()[0]}
    for mod in ("rdkit", "meeko", "gemmi", "openbabel"):
        try:
            m = __import__(mod)
            out[mod] = getattr(m, "__version__", "installed")
        except Exception:  # noqa: BLE001
            out[mod] = None
            out.setdefault("missing", []).append(mod)
    obabel = os.path.join(os.path.dirname(sys.executable), "obabel.exe" if os.name == "nt" else "obabel")
    if not os.path.exists(obabel):
        found = shutil.which("obabel")
        obabel = found or ""
    out["obabel"] = obabel if obabel and os.path.exists(obabel) else None
    if not out["obabel"]:
        out.setdefault("missing", []).append("obabel")
    emit(out)


def prep_ligand(a):
    try:
        from rdkit import Chem
        from rdkit.Chem import AllChem, Descriptors, rdMolDescriptors
        from meeko import MoleculePreparation, PDBQTWriterLegacy
    except Exception as e:  # noqa: BLE001
        fail(f"Ligand preparation libraries unavailable: {e}")

    mol = Chem.MolFromSmiles(a.smiles)
    if mol is None:
        fail("SMILES could not be parsed by RDKit.")
    heavy = mol.GetNumHeavyAtoms()
    formula = rdMolDescriptors.CalcMolFormula(mol)
    mol = Chem.AddHs(mol)

    params = AllChem.ETKDGv3()
    params.randomSeed = 42
    params.maxIterations = 2000
    if AllChem.EmbedMolecule(mol, params) != 0:
        params.useRandomCoords = True
        if AllChem.EmbedMolecule(mol, params) != 0:
            fail("3D conformer generation failed for this structure.")
    method = "RDKit ETKDGv3 embedding"
    try:
        if AllChem.MMFFHasAllMoleculeParams(mol):
            AllChem.MMFFOptimizeMolecule(mol, maxIters=2000)
            method += " + MMFF94 optimisation"
        else:
            AllChem.UFFOptimizeMolecule(mol, maxIters=2000)
            method += " + UFF optimisation"
    except Exception:  # noqa: BLE001
        method += " (no force-field optimisation)"

    try:
        setups = MoleculePreparation().prepare(mol)
        pdbqt, ok, err = PDBQTWriterLegacy.write_string(setups[0])
    except Exception as e:  # noqa: BLE001
        fail(f"Meeko could not prepare the ligand: {e}")
    if not ok or not pdbqt.strip():
        fail(f"Meeko could not write PDBQT: {err}")

    torsions = 0
    for line in pdbqt.splitlines():
        if line.startswith("TORSDOF"):
            try:
                torsions = int(line.split()[1])
            except Exception:  # noqa: BLE001
                pass
    path = a.out + ".pdbqt"
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(pdbqt)
    emit({
        "ok": True, "pdbqt": path, "heavyAtoms": heavy, "formula": formula,
        "molecularWeight": round(Descriptors.MolWt(Chem.RemoveHs(mol)), 3),
        "torsions": torsions,
        "method": f"{method}; Meeko {__import__('meeko').__version__} PDBQT (Gasteiger-type charges, rotatable bonds assigned)",
    })


def _clean_protein(pdb_path, out_pdb):
    """Keep the first polymer chain's protein atoms only. Returns metadata."""
    import gemmi
    st = gemmi.read_structure(pdb_path)
    st.setup_entities()
    st.remove_hydrogens()
    st.remove_alternative_conformations()
    model = st[0]
    chain_id = None
    for ch in model:
        n = sum(1 for r in ch if gemmi.find_tabulated_residue(r.name) and gemmi.find_tabulated_residue(r.name).is_amino_acid())
        if n >= 30:
            chain_id = ch.name
            break
    if chain_id is None:
        raise RuntimeError("No protein chain with at least 30 residues was found in this PDB entry.")
    clean = gemmi.Structure()
    clean.cell = st.cell
    clean.spacegroup_hm = st.spacegroup_hm
    nm = gemmi.Model("1")
    src = model[chain_id]
    nc = gemmi.Chain(chain_id)
    residues = 0
    for r in src:
        info = gemmi.find_tabulated_residue(r.name)
        if info and info.is_amino_acid() and r.het_flag != "H":
            nc.add_residue(r)
            residues += 1
    nm.add_chain(nc)
    clean.add_model(nm)
    clean.write_pdb(out_pdb)
    try:
        title = st.info["_struct.title"]
    except Exception:  # noqa: BLE001
        title = ""
    return {"chain": chain_id, "residues": residues, "title": title}


def prep_receptor(a):
    try:
        meta = _clean_protein(a.pdb, a.out + "_clean.pdb")
    except Exception as e:  # noqa: BLE001
        fail(f"Receptor cleaning failed: {e}")
    obabel = os.path.join(os.path.dirname(sys.executable), "obabel.exe" if os.name == "nt" else "obabel")
    if not os.path.exists(obabel):
        obabel = "obabel"
    out = a.out + ".pdbqt"
    try:
        proc = subprocess.run(
            [obabel, a.out + "_clean.pdb", "-O", out, "-xr", "-p", "7.4"],
            capture_output=True, text=True, timeout=300,
        )
    except Exception as e:  # noqa: BLE001
        fail(f"Open Babel could not be executed: {e}")
    if proc.returncode != 0 or not os.path.exists(out) or os.path.getsize(out) == 0:
        fail(f"Open Babel receptor conversion failed: {(proc.stderr or proc.stdout).strip()[:500]}")
    atoms = sum(1 for l in open(out, encoding="utf-8", errors="ignore") if l.startswith(("ATOM", "HETATM")))
    if atoms == 0:
        fail("Prepared receptor contains no atoms.")
    emit({
        "ok": True, "pdbqt": out, "cleanPdb": a.out + "_clean.pdb", "atoms": atoms, **meta,
        "method": "gemmi: kept protein atoms of one chain, removed waters/heteroatoms/alt-locs; Open Babel: hydrogens added at pH 7.4, rigid-receptor PDBQT (Gasteiger charges)",
    })


def sites(a):
    try:
        import gemmi
        st = gemmi.read_structure(a.pdb)
    except Exception as e:  # noqa: BLE001
        fail(f"PDB could not be read: {e}")
    model = st[0]
    protein_chain = None
    for ch in model:
        n = sum(1 for r in ch if gemmi.find_tabulated_residue(r.name) and gemmi.find_tabulated_residue(r.name).is_amino_acid())
        if n >= 30:
            protein_chain = ch.name
            break
    found = {}
    for ch in model:
        if ch.name != protein_chain:
            continue
        for r in ch:
            if r.het_flag != "H" or r.name in NON_SITE_RESNAMES:
                continue
            atoms = [at for at in r if at.element.name != "H"]
            if len(atoms) < 8 or r.name in found:
                continue
            xs = [at.pos.x for at in atoms]
            ys = [at.pos.y for at in atoms]
            zs = [at.pos.z for at in atoms]
            ext = [max(xs) - min(xs), max(ys) - min(ys), max(zs) - min(zs)]
            found[r.name] = {
                "resname": r.name, "chain": ch.name, "seq": str(r.seqid.num), "heavyAtoms": len(atoms),
                "center": [round((max(xs) + min(xs)) / 2, 3), round((max(ys) + min(ys)) / 2, 3), round((max(zs) + min(zs)) / 2, 3)],
                # ligand extent + 8 A padding on every side (min 20 A), a standard focused-box rule
                "size": [round(max(20.0, e + 16.0), 1) for e in ext],
            }
    emit({"ok": True, "chain": protein_chain, "candidates": list(found.values())})


def main():
    p = argparse.ArgumentParser()
    sub = p.add_subparsers(dest="cmd", required=True)
    sub.add_parser("tools")
    s = sub.add_parser("prep-ligand"); s.add_argument("--smiles", required=True); s.add_argument("--out", required=True)
    s = sub.add_parser("prep-receptor"); s.add_argument("--pdb", required=True); s.add_argument("--out", required=True)
    s = sub.add_parser("sites"); s.add_argument("--pdb", required=True)
    a = p.parse_args()
    {"tools": tools, "prep-ligand": prep_ligand, "prep-receptor": prep_receptor, "sites": sites}[a.cmd](a)


if __name__ == "__main__":
    main()
