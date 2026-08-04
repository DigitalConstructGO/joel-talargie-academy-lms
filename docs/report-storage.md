# Report storage

Files use the existing private storage abstraction and keys shaped as `reports/{environment}/{requesterId}/{exportId}/{uuid}.{extension}`. Keys contain no email or filter data and are never presented by APIs. Downloads use five-minute signed URLs.
