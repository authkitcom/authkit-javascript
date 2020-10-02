with import <nixpkgs> {};

stdenv.mkDerivation {

  name = "authlogic-core";

  buildInputs = with pkgs; [
    nodejs-14_x
    nodePackages.yarn
  ];

}

