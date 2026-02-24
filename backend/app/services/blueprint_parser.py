def extract_file_list(blueprint: str) -> list[str]:
    """
    Extract file paths under '### FILE_LIST'
    """
    lines = blueprint.splitlines()

    file_list = []
    capture = False

    for line in lines:
        stripped = line.strip()

        if stripped.startswith("### FILE_LIST"):
            capture = True
            continue

        if capture:
            if stripped == "" or stripped.startswith("#"):
                continue

            # Stop if next section starts
            if stripped.startswith("##"):
                break

            file_list.append(stripped)

    return file_list